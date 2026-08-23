import { FilterQuery, PipelineStage, Types } from "mongoose";
import { Lineup } from "../models/lineup.model.js";
import { Season } from "../models/season.model.js";
import { GameMode } from "../models/gameMode.model.js";
import { Commander } from "../models/commander.model.js";
import { Synergy } from "../models/synergy.model.js";
import { Hero } from "../models/hero.model.js";
import { Like } from "../models/like.model.js";
import { SavedLineup } from "../models/savedLineup.model.js";
import { Rating } from "../models/rating.model.js";
import env from "../config/env.js";

export interface LineupListFilters {
  q?: string;
  season?: string;
  gameMode?: string;
  commander?: string;
  synergy?: string;
  hero?: string;
  author?: string;
  tag?: string;
  difficulty?: string;
  minRating?: number;
  sort: string;
  page: number;
  limit: number;
}

export interface ListOptions {
  status?: "published" | "draft" | "hidden";
  authorId?: string;
}

const NULL_ID = new Types.ObjectId("000000000000000000000000");

const CARD_POPULATE = [
  { path: "commander", select: "name slug image" },
  { path: "season", select: "name slug" },
  { path: "gameMode", select: "name slug boardConfig" },
  { path: "author", select: "username avatar" },
  { path: "synergies.synergy", select: "name slug image color" },
];

const DETAIL_POPULATE = [
  ...CARD_POPULATE,
  { path: "heroes.hero", select: "name slug image cost role synergies" },
  { path: "heroes.equipment", select: "name slug image statType tier" },
];

async function resolveSlugToId(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  model: any,
  slugOrId: string,
): Promise<Types.ObjectId | null> {
  if (/^[0-9a-fA-F]{24}$/.test(slugOrId)) {
    return new Types.ObjectId(slugOrId);
  }
  const doc = await model
    .findOne({ slug: slugOrId.toLowerCase() })
    .select("_id")
    .lean();
  return doc ? new Types.ObjectId(String(doc._id)) : null;
}

async function buildQuery(filters: LineupListFilters): Promise<FilterQuery<ILineupDoc>> {
  const query: FilterQuery<ILineupDoc> = {};

  if (filters.q) {
    const rx = new RegExp(filters.q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    query.$or = [
      { title: rx },
      { description: rx },
      { tags: rx },
      { "commanderSkill.name": rx },
    ];
  }

  if (filters.season) {
    query.season = (await resolveSlugToId(Season, filters.season)) ?? NULL_ID;
  }
  if (filters.gameMode) {
    query.gameMode = (await resolveSlugToId(GameMode, filters.gameMode)) ?? NULL_ID;
  }
  if (filters.commander) {
    query.commander = (await resolveSlugToId(Commander, filters.commander)) ?? NULL_ID;
  }
  if (filters.difficulty) {
    query.difficulty = filters.difficulty;
  }
  if (filters.tag) {
    query.tags = filters.tag.toLowerCase();
  }
  if (filters.author) {
    query.author = /^[0-9a-fA-F]{24}$/.test(filters.author)
      ? new Types.ObjectId(filters.author)
      : NULL_ID;
  }
  if (filters.synergy) {
    query["synergies.synergy"] =
      (await resolveSlugToId(Synergy, filters.synergy)) ?? NULL_ID;
  }
  if (filters.hero) {
    query["heroes.hero"] = (await resolveSlugToId(Hero, filters.hero)) ?? NULL_ID;
  }

  return query;
}

/**
 * Trending score: weighted engagement decaying with time since last activity.
 * Isolated here so the algorithm can be tuned/replaced without touching routes.
 */
function trendingScorePipeline(): PipelineStage[] {
  const gravity = env.TRENDING_GRAVITY;
  return [
    {
      $addFields: {
        hoursSinceActivity: {
          $divide: [{ $subtract: ["$$NOW", "$updatedAt"] }, 1000 * 60 * 60],
        },
      },
    },
    {
      $addFields: {
        trendingScore: {
          $divide: [
            {
              $add: [
                { $multiply: ["$viewsCount", 0.5] },
                { $multiply: ["$likesCount", 3] },
                { $multiply: ["$savesCount", 3] },
                { $multiply: ["$commentsCount", 4] },
                { $multiply: ["$ratingsCount", 2] },
                { $multiply: ["$averageRating", 2] },
              ],
            },
            { $pow: [{ $add: ["$hoursSinceActivity", 2] }, gravity] },
          ],
        },
      },
    },
    { $sort: { trendingScore: -1 as const } },
  ];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ILineupDoc = any;

export async function listLineups(
  filters: LineupListFilters,
  options: ListOptions = {},
) {
  const query = await buildQuery(filters);

  if (!options.authorId && !options.status) {
    query.status = "published";
  } else if (options.status) {
    query.status = options.status;
  }

  const skip = (filters.page - 1) * filters.limit;

  let rawItems: ILineupDoc[];
  let total: number;

  if (filters.sort === "trending") {
    const pipeline: PipelineStage[] = [
      { $match: query },
      ...trendingScorePipeline(),
      {
        $facet: {
          results: [{ $skip: skip }, { $limit: filters.limit }],
          totalCount: [{ $count: "count" }],
        },
      },
    ];
    const [agg] = await Lineup.aggregate(pipeline);
    total = agg?.totalCount[0]?.count ?? 0;
    rawItems = agg?.results ?? [];
    rawItems = await Lineup.populate(rawItems, CARD_POPULATE);
  } else {
    const sortMap: Record<string, Record<string, 1 | -1>> = {
      likes: { likesCount: -1, viewsCount: -1 },
      views: { viewsCount: -1, likesCount: -1 },
      rating: { averageRating: -1, ratingsCount: -1 },
      newest: { createdAt: -1 },
      updated: { updatedAt: -1 },
    };
    const sort = sortMap[filters.sort] ?? { createdAt: -1 };
    [rawItems, total] = await Promise.all([
      Lineup.find(query)
        .sort(sort)
        .skip(skip)
        .limit(filters.limit)
        .populate(CARD_POPULATE)
        .lean(),
      Lineup.countDocuments(query),
    ]);
  }

  return {
    items: rawItems,
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / filters.limit)),
    },
  };
}

export async function attachViewerContext(
  items: ILineupDoc[],
  viewerId?: Types.ObjectId,
): Promise<void> {
  if (!viewerId || items.length === 0) return;
  const ids = items.map((l) => l._id);
  const [likes, saves] = await Promise.all([
    Like.find({ user: viewerId, lineup: { $in: ids } })
      .select("lineup")
      .lean(),
    SavedLineup.find({ user: viewerId, lineup: { $in: ids } })
      .select("lineup")
      .lean(),
  ]);
  const likedSet = new Set(likes.map((l) => String(l.lineup)));
  const savedSet = new Set(saves.map((s) => String(s.lineup)));
  for (const item of items) {
    item.likedByViewer = likedSet.has(String(item._id));
    item.savedByViewer = savedSet.has(String(item._id));
  }
}

export async function getLineupDetail(slug: string) {
  const doc = await Lineup.findOne({ slug }).populate(DETAIL_POPULATE).lean();
  return doc as ILineupDoc | null;
}

export async function getViewerRating(
  lineupId: Types.ObjectId,
  viewerId?: Types.ObjectId,
): Promise<number | null> {
  if (!viewerId) return null;
  const rating = await Rating.findOne({
    lineup: lineupId,
    user: viewerId,
  })
    .select("rating")
    .lean();
  return rating?.rating ?? null;
}

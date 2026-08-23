import { Request, Response } from "express";
import { Types } from "mongoose";
import { Lineup } from "../models/lineup.model.js";
import { Season } from "../models/season.model.js";
import { GameMode } from "../models/gameMode.model.js";
import { Commander } from "../models/commander.model.js";
import { Hero } from "../models/hero.model.js";
import { Synergy } from "../models/synergy.model.js";
import { Equipment } from "../models/equipment.model.js";
import { GoGoCard } from "../models/gogocard.model.js";
import { Like } from "../models/like.model.js";
import { SavedLineup } from "../models/savedLineup.model.js";
import { Rating } from "../models/rating.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { slugify, randomSuffix } from "../utils/slugify.js";
import {
  listLineups,
  attachViewerContext,
  getLineupDetail,
  getViewerRating,
} from "../services/lineup.service.js";

const DETAIL_POPULATE_FULL = [
  { path: "commander", select: "name slug image skills" },
  {
    path: "recommendedCommanders",
    select: "name slug image skills",
  },
  { path: "gogoCards", select: "name slug image rarity description" },
  { path: "season", select: "name slug" },
  { path: "gameMode", select: "name slug boardConfig" },
  { path: "author", select: "username avatar" },
  { path: "synergies.synergy", select: "name slug image color" },
  { path: "heroes.hero", select: "name slug image cost role synergies" },
  { path: "heroes.equipment", select: "name slug image statType tier category" },
];
import { recomputeRatingAggregates } from "../services/rating.service.js";
import { deleteImage } from "../services/upload.service.js";

async function assertRefsExist(body: Record<string, unknown>) {
  const [commander, season, gameMode] = await Promise.all([
    body.commander ? Commander.findById(body.commander as string) : null,
    body.season ? Season.findById(body.season as string) : null,
    body.gameMode ? GameMode.findById(body.gameMode as string) : null,
  ]);
  if (body.commander && !commander)
    throw ApiError.badRequest("Commander not found");
  if (body.season && !season) throw ApiError.badRequest("Season not found");
  if (body.gameMode && !gameMode) throw ApiError.badRequest("Game mode not found");

  if (
    Array.isArray(body.recommendedCommanders) &&
    body.recommendedCommanders.length > 0
  ) {
    const count = await Commander.countDocuments({
      _id: { $in: body.recommendedCommanders as string[] },
    });
    if (count !== (body.recommendedCommanders as string[]).length)
      throw ApiError.badRequest("One or more recommended commanders not found");
  }

  if (Array.isArray(body.gogoCards) && body.gogoCards.length > 0) {
    const count = await GoGoCard.countDocuments({
      _id: { $in: body.gogoCards as string[] },
    });
    if (count !== (body.gogoCards as string[]).length)
      throw ApiError.badRequest("One or more gogo cards not found");
  }
}

async function generateUniqueSlug(title: string): Promise<string> {
  const base = slugify(title) || "lineup";
  let candidate = base;
  while (await Lineup.exists({ slug: candidate })) {
    candidate = `${base}-${randomSuffix(5)}`;
  }
  return candidate;
}

export const listLineupsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await listLineups({
      q: req.query.q as string | undefined,
      season: req.query.season as string | undefined,
      gameMode: req.query.gameMode as string | undefined,
      commander: req.query.commander as string | undefined,
      synergy: req.query.synergy as string | undefined,
      hero: req.query.hero as string | undefined,
      tag: req.query.tag as string | undefined,
      difficulty: req.query.difficulty as string | undefined,
      minRating: req.query.minRating ? Number(req.query.minRating) : undefined,
      sort: String(req.query.sort || "trending"),
      page: Math.max(1, Number(req.query.page) || 1),
      limit: Math.min(48, Number(req.query.limit) || 12),
    });

    await attachViewerContext(result.items, req.user?._id);

    res.json({
      success: true,
      data: { lineups: result.items, pagination: result.pagination },
    });
  },
);

export const getFeatured = asyncHandler(
  async (_req: Request, res: Response) => {
    const items = await Lineup.find({ status: "published", featured: true })
      .sort({ updatedAt: -1 })
      .limit(6)
      .populate([
        { path: "commander", select: "name slug image" },
        { path: "author", select: "username avatar" },
        { path: "synergies.synergy", select: "name slug image color" },
      ])
      .lean();
    res.json({ success: true, data: { lineups: items } });
  },
);

export const getLineupByIdForEdit = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const lineup = await Lineup.findById(req.params.id)
      .populate([
        ...DETAIL_POPULATE_FULL,
        "heroes.hero.synergies",
      ]);
    if (!lineup) throw ApiError.notFound("Lineup not found");

    const isAuthor =
      String((lineup.author as { _id?: unknown })?._id ?? lineup.author) ===
      String(req.user._id);
    if (!isAuthor && req.user.role !== "admin") {
      throw ApiError.forbidden("You can only edit your own lineups");
    }

    res.json({ success: true, data: { lineup } });
  },
);

export const getLineupBySlug = asyncHandler(
  async (req: Request, res: Response) => {
    const lineup = await getLineupDetail(req.params.slug);
    if (!lineup) throw ApiError.notFound("Lineup not found");

    const isAuthor =
      req.user && String(lineup.author._id) === String(req.user._id);
    const isAdmin = req.user?.role === "admin";

    if (lineup.status !== "published" && !isAuthor && !isAdmin) {
      throw ApiError.notFound("Lineup not found");
    }

    const items = [lineup];
    await attachViewerContext(items, req.user?._id);
    const viewerRating = await getViewerRating(
      lineup._id as Types.ObjectId,
      req.user?._id,
    );

    res.json({
      success: true,
      data: { lineup, viewerRating, isAuthor: Boolean(isAuthor) },
    });
  },
);

function extractLineupPayload(body: Record<string, unknown>) {
  return {
    title: body.title as string,
    description: body.description ?? "",
    season: body.season,
    gameMode: body.gameMode,
    difficulty: body.difficulty,
    commander: body.commander ?? null,
    commanderSkill: {
      name: (body.commanderSkillName as string) || "",
      description: "",
    },
    recommendedCommanders: body.recommendedCommanders ?? [],
    gogoCards: body.gogoCards ?? [],
    heroes: body.heroes,
    synergies: body.synergies ?? [],
    strategy: body.strategy ?? {},
    tags: body.tags ?? [],
    thumbnail:
      body.thumbnailUrl !== undefined
        ? body.thumbnailUrl
          ? { url: body.thumbnailUrl, publicId: body.thumbnailPublicId }
          : null
        : undefined,
    status: body.status === "draft" ? "draft" : "published",
  };
}

export const createLineup = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    await assertRefsExist(req.body);

    const payload = extractLineupPayload(req.body);
    const lineup = await Lineup.create({
      ...payload,
      author: req.user._id,
      slug: await generateUniqueSlug(payload.title),
    });

    res.status(201).json({ success: true, data: { lineup } });
  },
);

export const updateLineup = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const lineup = await Lineup.findById(req.params.id);
    if (!lineup) throw ApiError.notFound("Lineup not found");

    const isAuthor = String(lineup.author) === String(req.user._id);
    if (!isAuthor && req.user.role !== "admin") {
      throw ApiError.forbidden("You can only edit your own lineups");
    }

    await assertRefsExist(req.body);
    const payload = extractLineupPayload(req.body);

    if (
      payload.thumbnail === null &&
      lineup.thumbnail?.publicId
    ) {
      void deleteImage(lineup.thumbnail.publicId);
    }
    delete payload.thumbnail;

    if (payload.title && payload.title !== lineup.title) {
      lineup.slug = await generateUniqueSlug(payload.title);
    }

    Object.assign(lineup, payload);
    await lineup.save();

    res.json({ success: true, data: { lineup } });
  },
);

export const deleteLineup = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const lineup = await Lineup.findById(req.params.id);
    if (!lineup) throw ApiError.notFound("Lineup not found");

    const isAuthor = String(lineup.author) === String(req.user._id);
    if (!isAuthor && req.user.role !== "admin") {
      throw ApiError.forbidden("You can only delete your own lineups");
    }

    if (lineup.thumbnail?.publicId) {
      void deleteImage(lineup.thumbnail.publicId);
    }

    await Promise.all([
      Like.deleteMany({ lineup: lineup._id }),
      SavedLineup.deleteMany({ lineup: lineup._id }),
      Rating.deleteMany({ lineup: lineup._id }),
      lineup.deleteOne(),
    ]);

    res.json({ success: true, message: "Lineup deleted" });
  },
);

export const likeLineup = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const lineup = await Lineup.findOne({
      _id: req.params.id,
      status: "published",
    });
    if (!lineup) throw ApiError.notFound("Lineup not found");

    try {
      await Like.create({ lineup: lineup._id, user: req.user._id });
      await Lineup.updateOne(
        { _id: lineup._id },
        { $inc: { likesCount: 1 } },
      );
    } catch (err) {
      if ((err as { code?: number }).code === 11000) {
        throw ApiError.conflict("You already liked this lineup");
      }
      throw err;
    }

    res.json({ success: true, data: { liked: true } });
  },
);

export const unlikeLineup = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const deleted = await Like.findOneAndDelete({
      lineup: req.params.id,
      user: req.user._id,
    });
    if (deleted) {
      await Lineup.updateOne(
        { _id: req.params.id },
        { $inc: { likesCount: -1 } },
      );
    }
    res.json({ success: true, data: { liked: false } });
  },
);

export const saveLineup = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const lineup = await Lineup.findOne({
      _id: req.params.id,
      status: "published",
    });
    if (!lineup) throw ApiError.notFound("Lineup not found");

    try {
      await SavedLineup.create({ lineup: lineup._id, user: req.user._id });
      await Lineup.updateOne(
        { _id: lineup._id },
        { $inc: { savesCount: 1 } },
      );
    } catch (err) {
      if ((err as { code?: number }).code === 11000) {
        throw ApiError.conflict("Already saved");
      }
      throw err;
    }

    res.json({ success: true, data: { saved: true } });
  },
);

export const unsaveLineup = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const deleted = await SavedLineup.findOneAndDelete({
      lineup: req.params.id,
      user: req.user._id,
    });
    if (deleted) {
      await Lineup.updateOne(
        { _id: req.params.id },
        { $inc: { savesCount: -1 } },
      );
    }
    res.json({ success: true, data: { saved: false } });
  },
);

export const rateLineup = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const lineup = await Lineup.findOne({
      _id: req.params.id,
      status: "published",
    });
    if (!lineup) throw ApiError.notFound("Lineup not found");

    await Rating.findOneAndUpdate(
      { lineup: lineup._id, user: req.user._id },
      { rating: req.body.rating },
      { upsert: true, new: true, runValidators: true },
    );

    const aggregates = await recomputeRatingAggregates(lineup._id);

    res.json({ success: true, data: aggregates });
  },
);

export const trackView = asyncHandler(async (req: Request, res: Response) => {
  const lineup = await Lineup.findById(req.params.id).select("_id");
  if (!lineup) throw ApiError.notFound("Lineup not found");

  const cookieName = `ggt_v_${String(lineup._id).slice(-12)}`;
  if (!req.cookies?.[cookieName]) {
    await Lineup.updateOne(
      { _id: lineup._id },
      { $inc: { viewsCount: 1 } },
    );
    res.cookie(cookieName, "1", {
      maxAge: 6 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: "lax",
    });
  }

  res.json({ success: true });
});

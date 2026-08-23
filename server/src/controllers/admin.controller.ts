import { Request, Response } from "express";
import { User } from "../models/user.model.js";
import { Lineup } from "../models/lineup.model.js";
import { Comment } from "../models/comment.model.js";
import { Report } from "../models/report.model.js";
import { Season } from "../models/season.model.js";
import { GameMode } from "../models/gameMode.model.js";
import { Commander } from "../models/commander.model.js";
import { Hero } from "../models/hero.model.js";
import { Synergy } from "../models/synergy.model.js";
import { Equipment } from "../models/equipment.model.js";
import { GoGoCard } from "../models/gogocard.model.js";
import { deleteImage } from "../services/upload.service.js";
import { Like } from "../models/like.model.js";
import { SavedLineup } from "../models/savedLineup.model.js";
import { Rating } from "../models/rating.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { slugify, randomSuffix } from "../utils/slugify.js";
import { toPublicUser } from "../utils/sanitizeUser.js";
import {
  seasonSchema,
  gameModeSchema,
  commanderSchema,
  synergySchema,
  heroSchema,
  equipmentSchema,
  gogoCardSchema,
  bulkDeleteSchema,
} from "../validators/gamedata.schema.js";

export const getStats = asyncHandler(
  async (_req: Request, res: Response) => {
    const [
      users,
      lineups,
      publishedLineups,
      comments,
      pendingReports,
      openReports,
    ] = await Promise.all([
      User.countDocuments(),
      Lineup.countDocuments(),
      Lineup.countDocuments({ status: "published" }),
      Comment.countDocuments({ isDeleted: false }),
      Report.countDocuments({ status: "pending" }),
      Report.countDocuments({ status: { $ne: "dismissed" } }),
    ]);
    res.json({
      success: true,
      data: {
        stats: {
          users,
          lineups,
          publishedLineups,
          comments,
          pendingReports,
          openReports,
        },
      },
    });
  },
);

export const listUsers = asyncHandler(async (req: Request, res: Response) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Number(req.query.limit) || 20);
  const q = String(req.query.q || "").trim().toLowerCase();

  const query = q
    ? {
        $or: [
          { username: new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") },
          { email: q },
        ],
      }
    : {};

  const [users, total] = await Promise.all([
    User.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    User.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: {
      users: users.map(toPublicUser).map((u, i) => ({
        ...u,
        email: users[i].email,
        status: users[i].status,
        joinedAt: users[i].createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    },
  });
});

export const setUserStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const user = await User.findById(req.params.id);
    if (!user) throw ApiError.notFound("User not found");
    if (String(user._id) === String(req.user?._id)) {
      throw ApiError.badRequest("You cannot ban yourself");
    }
    if (user.role === "admin" && req.body.status === "banned") {
      throw ApiError.badRequest("Cannot ban an admin account");
    }
    user.status = req.body.status;
    await user.save();
    res.json({
      success: true,
      message: `User ${req.body.status === "banned" ? "banned" : "unbanned"}`,
    });
  },
);

export const listAllLineups = asyncHandler(
  async (req: Request, res: Response) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Number(req.query.limit) || 20);
    const status = req.query.status as string | undefined;
    const q = String(req.query.q || "").trim();

    const query: Record<string, unknown> = {};
    if (status && ["draft", "published", "hidden"].includes(status)) {
      query.status = status;
    }
    if (q) {
      query.title = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    }

    const [lineups, total] = await Promise.all([
      Lineup.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("author", "username avatar")
        .populate("commander", "name slug image")
        .lean(),
      Lineup.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        lineups,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.max(1, Math.ceil(total / limit)),
        },
      },
    });
  },
);

export const setLineupStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const lineup = await Lineup.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true },
    );
    if (!lineup) throw ApiError.notFound("Lineup not found");
    res.json({
      success: true,
      message: `Lineup ${req.body.status}`,
      data: { lineup },
    });
  },
);

export const setLineupFeatured = asyncHandler(
  async (req: Request, res: Response) => {
    const lineup = await Lineup.findByIdAndUpdate(
      req.params.id,
      { featured: req.body.featured },
      { new: true },
    );
    if (!lineup) throw ApiError.notFound("Lineup not found");
    res.json({
      success: true,
      message: req.body.featured
        ? "Lineup featured"
        : "Lineup removed from featured",
      data: { lineup },
    });
  },
);

export const adminDeleteLineup = asyncHandler(
  async (req: Request, res: Response) => {
    const lineup = await Lineup.findById(req.params.id);
    if (!lineup) throw ApiError.notFound("Lineup not found");

    await Promise.all([
      Like.deleteMany({ lineup: lineup._id }),
      SavedLineup.deleteMany({ lineup: lineup._id }),
      Rating.deleteMany({ lineup: lineup._id }),
      Comment.deleteMany({ lineup: lineup._id }),
      lineup.deleteOne(),
    ]);

    res.json({ success: true, message: "Lineup deleted" });
  },
);

export const adminDeleteComment = asyncHandler(
  async (req: Request, res: Response) => {
    const comment = await Comment.findById(req.params.id);
    if (!comment) throw ApiError.notFound("Comment not found");

    const replyCount = await Comment.countDocuments({
      parentComment: comment._id,
    });
    comment.isDeleted = true;
    comment.content = "[removed by moderator]";
    await comment.save();
    await Lineup.updateOne(
      { _id: comment.lineup },
      { $inc: { commentsCount: -(1 + replyCount) } },
    );

    res.json({ success: true, message: "Comment removed" });
  },
);

export const listReports = asyncHandler(
  async (req: Request, res: Response) => {
    const status = String(req.query.status || "pending");
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Number(req.query.limit) || 20);

    const query =
      status === "all"
        ? {}
        : { status: ["pending", "resolved", "dismissed"].includes(status) ? status : "pending" };

    const [reports, total] = await Promise.all([
      Report.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("reporter", "username avatar")
        .lean(),
      Report.countDocuments(query),
    ]);

    const enriched = await Promise.all(
      reports.map(async (r) => {
        let target: Record<string, unknown> | null = null;
        try {
          if (r.targetType === "lineup") {
            target = await Lineup.findById(r.targetId)
              .select("title slug status")
              .lean();
          } else if (r.targetType === "comment") {
            target = await Comment.findById(r.targetId)
              .select("content author isDeleted")
              .populate("author", "username")
              .lean();
          } else if (r.targetType === "user") {
            target = await User.findById(r.targetId)
              .select("username status")
              .lean();
          }
        } catch {
          target = null;
        }
        return { ...r, target };
      }),
    );

    res.json({
      success: true,
      data: {
        reports: enriched,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.max(1, Math.ceil(total / limit)),
        },
      },
    });
  },
);

export const resolveReport = asyncHandler(
  async (req: Request, res: Response) => {
    const report = await Report.findById(req.params.id);
    if (!report) throw ApiError.notFound("Report not found");

    report.status = req.body.status;
    report.resolutionNote = req.body.resolutionNote || "";
    report.resolvedBy = req.user!._id;
    report.resolvedAt = new Date();
    await report.save();

    res.json({ success: true, message: "Report updated", data: { report } });
  },
);

const GAME_DATA_MODELS = {
  seasons: Season,
  "game-modes": GameMode,
  commanders: Commander,
  heroes: Hero,
  synergies: Synergy,
  equipment: Equipment,
  "gogo-cards": GoGoCard,
} as const;

const GAME_DATA_SCHEMAS = {
  seasons: seasonSchema,
  "game-modes": gameModeSchema,
  commanders: commanderSchema,
  heroes: heroSchema,
  synergies: synergySchema,
  equipment: equipmentSchema,
  "gogo-cards": gogoCardSchema,
} as const;

type EntityKey = keyof typeof GAME_DATA_MODELS;

function getEntity(entity: string): EntityKey | null {
  return entity in GAME_DATA_MODELS ? (entity as EntityKey) : null;
}

async function uniqueSlug(model: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  exists(q: Record<string, unknown>): Promise<unknown>;
}, name: string): Promise<string> {
  const base = slugify(name) || randomSuffix(6);
  let candidate = base;
  while (await model.exists({ slug: candidate })) {
    candidate = `${base}-${randomSuffix(4)}`;
  }
  return candidate;
}

async function assertHeroSynergyComposition(ids: string[]): Promise<void> {
  const unique = [...new Set(ids)];
  const docs = await Synergy.find({ _id: { $in: unique } })
    .select("type")
    .lean();
  if (docs.length !== unique.length) {
    throw ApiError.badRequest("One or more selected synergies do not exist");
  }
  const factions = docs.filter((d) => d.type === "faction").length;
  const roles = docs.filter((d) => d.type === "role").length;
  if (factions !== 1 || roles < 1 || roles > 2) {
    throw ApiError.badRequest(
      "A hero needs exactly 1 faction synergy and 1-2 role synergies",
    );
  }
}

export const createGameEntity = asyncHandler(
  async (req: Request, res: Response) => {
    const key = getEntity(req.params.entity);
    if (!key) throw ApiError.notFound("Unknown entity type");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Model: any = GAME_DATA_MODELS[key];
    const parsed = GAME_DATA_SCHEMAS[key].parse(req.body);
    if (key === "heroes") {
      await assertHeroSynergyComposition(
        (parsed as { synergies?: string[] }).synergies ?? [],
      );
    }
    const doc = await Model.create({ ...parsed, slug: await uniqueSlug(Model, parsed.name) });

    res.status(201).json({ success: true, data: { item: doc } });
  },
);

export const updateGameEntity = asyncHandler(
  async (req: Request, res: Response) => {
    const key = getEntity(req.params.entity);
    if (!key) throw ApiError.notFound("Unknown entity type");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Model: any = GAME_DATA_MODELS[key];
    const existing = await Model.findById(req.params.id);
    if (!existing) throw ApiError.notFound("Entity not found");

    const parsed = GAME_DATA_SCHEMAS[key]
      .partial()
      .parse(req.body);
    const patch = parsed as { synergies?: string[]; imagePublicId?: string };
    if (key === "heroes" && Array.isArray(patch.synergies)) {
      await assertHeroSynergyComposition(patch.synergies);
    }
    const nextPublicId = patch.imagePublicId;
    const currentPublicId = existing.imagePublicId as string | undefined;
    if (nextPublicId && nextPublicId !== currentPublicId && currentPublicId) {
      await deleteImage(currentPublicId).catch(() => undefined);
    }
    Object.assign(existing, parsed);
    await existing.save();

    res.json({ success: true, data: { item: existing } });
  },
);

export const deleteGameEntity = asyncHandler(
  async (req: Request, res: Response) => {
    const key = getEntity(req.params.entity);
    if (!key) throw ApiError.notFound("Unknown entity type");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Model: any = GAME_DATA_MODELS[key];
    const deleted = await Model.findByIdAndDelete(req.params.id);
    if (!deleted) throw ApiError.notFound("Entity not found");
    if (deleted.imagePublicId) {
      await deleteImage(String(deleted.imagePublicId)).catch(() => undefined);
    }

    res.json({ success: true, message: "Entity deleted" });
  },
);

export const bulkDeleteGameEntities = asyncHandler(
  async (req: Request, res: Response) => {
    const key = getEntity(req.params.entity);
    if (!key) throw ApiError.notFound("Unknown entity type");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Model: any = GAME_DATA_MODELS[key];
    const { ids } = bulkDeleteSchema.parse(req.body);

    const docs = (await Model.find({ _id: { $in: ids } })
      .select("imagePublicId")
      .lean()) as Array<{ imagePublicId?: string }>;
    const { deletedCount } = await Model.deleteMany({ _id: { $in: ids } });

    await Promise.all(
      docs
        .map((d) => String(d.imagePublicId ?? ""))
        .filter(Boolean)
        .map((publicId) => deleteImage(publicId).catch(() => undefined)),
    );

    res.json({
      success: true,
      message: `${deletedCount} entities deleted`,
      data: { deletedCount },
    });
  },
);

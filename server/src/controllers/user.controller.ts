import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { User } from "../models/user.model.js";
import { Lineup } from "../models/lineup.model.js";
import { SavedLineup } from "../models/savedLineup.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { toPublicUser } from "../utils/sanitizeUser.js";
import { listLineups, attachViewerContext } from "../services/lineup.service.js";
import { deleteImage } from "../services/upload.service.js";

export const getProfile = asyncHandler(
  async (req: Request, res: Response) => {
    const { username } = req.params;
    const user = await User.findOne({
      username: username.toLowerCase(),
    });
    if (!user) throw ApiError.notFound("User not found");

    const publishedCount = await Lineup.countDocuments({
      author: user._id,
      status: "published",
    });

    const isSelf =
      req.user && String(req.user._id) === String(user._id);
    const isFollowing =
      req.user && !isSelf
        ? user.followers.some((f) => String(f) === String(req.user!._id))
        : false;

    res.json({
      success: true,
      data: {
        user: {
          ...toPublicUser(user),
          lineupsCount: publishedCount,
          joinedAt: user.createdAt,
        },
        isSelf: Boolean(isSelf),
        isFollowing,
      },
    });
  },
);

export const getUserLineups = asyncHandler(
  async (req: Request, res: Response) => {
    const { username } = req.params;
    const user = await User.findOne({ username: username.toLowerCase() });
    if (!user) throw ApiError.notFound("User not found");

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(48, Number(req.query.limit) || 12);
    const sort = String(req.query.sort || "newest");

    const isSelf =
      req.user && String(req.user._id) === String(user._id);

    const result = await listLineups(
      {
        sort,
        page,
        limit,
        author: String(user._id),
      },
      isSelf ? {} : {},
    );

    if (!isSelf) {
      result.items = result.items.filter((l) => l.status === "published");
    }

    await attachViewerContext(result.items, req.user?._id);

    res.json({
      success: true,
      data: { lineups: result.items, pagination: result.pagination },
    });
  },
);

export const getLikedLineups = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const likes = await (
      await import("../models/like.model.js")
    ).Like.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(100)
      .populate({
        path: "lineup",
        match: { status: "published" },
        populate: [
          { path: "commander", select: "name slug image" },
          { path: "author", select: "username avatar" },
          { path: "synergies.synergy", select: "name slug image color" },
        ],
      });

    const lineups = likes
      .map((l) => l.lineup)
      .filter((l): l is NonNullable<typeof l> => Boolean(l));

    res.json({ success: true, data: { lineups } });
  },
);

export const getSavedLineups = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const saves = await SavedLineup.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(200)
      .populate({
        path: "lineup",
        match: { status: "published" },
        populate: [
          { path: "commander", select: "name slug image" },
          { path: "season", select: "name slug" },
          { path: "author", select: "username avatar" },
          { path: "synergies.synergy", select: "name slug image color" },
        ],
      });

    const lineups = saves
      .map((s) => s.lineup)
      .filter((l): l is NonNullable<typeof l> => Boolean(l));

    res.json({ success: true, data: { lineups } });
  },
);

export const followUser = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const target = await User.findById(req.params.id);
    if (!target) throw ApiError.notFound("User not found");
    if (String(target._id) === String(req.user._id)) {
      throw ApiError.badRequest("You cannot follow yourself");
    }

    await User.updateOne(
      { _id: req.user._id },
      { $addToSet: { following: target._id } },
    );
    await User.updateOne(
      { _id: target._id },
      { $addToSet: { followers: req.user._id } },
    );

    res.json({ success: true, data: { following: true } });
  },
);

export const unfollowUser = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const target = await User.findById(req.params.id);
    if (!target) throw ApiError.notFound("User not found");

    await User.updateOne(
      { _id: req.user._id },
      { $pull: { following: target._id } },
    );
    await User.updateOne(
      { _id: target._id },
      { $pull: { followers: req.user._id } },
    );

    res.json({ success: true, data: { following: false } });
  },
);

export const updateProfile = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const user = await User.findById(req.user._id);
    if (!user) throw ApiError.notFound("User not found");

    const { bio, avatarUrl, avatarPublicId } = req.body;

    if (bio !== undefined) user.bio = bio;
    if (avatarUrl !== undefined) {
      if (user.avatar?.publicId && user.avatar.publicId !== avatarPublicId) {
        void deleteImage(user.avatar.publicId);
      }
      user.avatar = avatarUrl ? { url: avatarUrl, publicId: avatarPublicId } : null;
    }

    await user.save();
    res.json({ success: true, data: { user: toPublicUser(user) } });
  },
);

export const changePassword = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const user = await User.findById(req.user._id).select("+passwordHash");
    if (!user) throw ApiError.notFound("User not found");

    const { currentPassword, newPassword } = req.body;
    if (!(await user.comparePassword(currentPassword))) {
      throw ApiError.unauthorized("Current password is incorrect");
    }
    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();

    res.json({ success: true, message: "Password updated" });
  },
);

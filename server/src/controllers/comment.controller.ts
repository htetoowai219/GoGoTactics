import { Request, Response } from "express";
import { Comment } from "../models/comment.model.js";
import { Lineup } from "../models/lineup.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CommentLean = any;

export const listComments = asyncHandler(
  async (req: Request, res: Response) => {
    const lineupId = req.params.id;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Number(req.query.limit) || 10);

    const [topLevel, total] = await Promise.all([
      Comment.find({ lineup: lineupId, parentComment: null })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("author", "username avatar")
        .lean(),
      Comment.countDocuments({ lineup: lineupId, parentComment: null }),
    ]);

    const parentIds = topLevel.map((c) => c._id);
    const replies =
      parentIds.length > 0
        ? await Comment.find({ parentComment: { $in: parentIds } })
            .sort({ createdAt: 1 })
            .populate("author", "username avatar")
            .lean()
        : [];

    const byParent = new Map<string, CommentLean[]>();
    for (const reply of replies) {
      const key = String(reply.parentComment);
      if (!byParent.has(key)) byParent.set(key, []);
      byParent.get(key)!.push(reply);
    }

    const viewerId = req.user?._id ? String(req.user._id) : null;
    const decorate = (c: CommentLean): CommentLean => ({
      ...c,
      likedByViewer: viewerId
        ? c.likedBy.some((u: unknown) => String(u) === viewerId)
        : false,
      likedBy: undefined,
      replies: (byParent.get(String(c._id)) ?? []).map(decorate),
    });

    res.json({
      success: true,
      data: {
        comments: topLevel.map(decorate),
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

export const createComment = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const lineup = await Lineup.findOne({
      _id: req.params.id,
      status: "published",
    });
    if (!lineup) throw ApiError.notFound("Lineup not found");

    let parentComment = null;
    if (req.body.parentComment) {
      const parent = await Comment.findOne({
        _id: req.body.parentComment,
        lineup: lineup._id,
      });
      if (!parent) throw ApiError.badRequest("Parent comment not found");
      if (parent.parentComment) {
        parentComment = parent.parentComment;
      } else {
        parentComment = parent._id;
      }
    }

    const comment = await Comment.create({
      lineup: lineup._id,
      author: req.user._id,
      content: req.body.content,
      parentComment,
    });
    await comment.populate("author", "username avatar");

    await Lineup.updateOne(
      { _id: lineup._id },
      { $inc: { commentsCount: 1 } },
    );

    res.status(201).json({
      success: true,
      data: { comment: { ...comment.toObject(), likedByViewer: false, replies: [] } },
    });
  },
);

export const likeComment = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const comment = await Comment.findById(req.params.id);
    if (!comment || comment.isDeleted)
      throw ApiError.notFound("Comment not found");

    const userId = String(req.user._id);
    const already = comment.likedBy.some((u) => String(u) === userId);

    if (already) {
      comment.likedBy = comment.likedBy.filter(
        (u) => String(u) !== userId,
      ) as typeof comment.likedBy;
    } else {
      comment.likedBy.push(req.user._id);
    }
    comment.likesCount = comment.likedBy.length;
    await comment.save();

    res.json({
      success: true,
      data: { liked: !already, likesCount: comment.likesCount },
    });
  },
);

export const deleteComment = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const comment = await Comment.findById(req.params.id);
    if (!comment || comment.isDeleted)
      throw ApiError.notFound("Comment not found");

    const isAuthor = String(comment.author) === String(req.user._id);
    if (!isAuthor && req.user.role !== "admin") {
      throw ApiError.forbidden("You can only delete your own comments");
    }

    const replyCount = await Comment.countDocuments({
      parentComment: comment._id,
    });

    comment.isDeleted = true;
    comment.content = "[deleted]";
    await comment.save();

    await Lineup.updateOne(
      { _id: comment.lineup },
      { $inc: { commentsCount: -(1 + replyCount) } },
    );

    res.json({ success: true, message: "Comment deleted" });
  },
);

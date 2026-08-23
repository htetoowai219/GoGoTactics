import { z } from "zod";
import { objectId } from "./lineup.schema.js";

export const createCommentSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Comment cannot be empty")
    .max(2000, "Comment is too long"),
  parentComment: objectId.nullable().optional(),
});

export const ratingSchema = z.object({
  rating: z.number().int().min(1).max(5),
});

export const reportSchema = z.object({
  targetType: z.enum(["lineup", "comment", "user"]),
  targetId: objectId,
  reason: z.enum([
    "spam",
    "incorrect_information",
    "offensive_content",
    "misleading_content",
    "other",
  ]),
  description: z.string().max(1000).optional(),
});

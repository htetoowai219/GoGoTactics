import { z } from "zod";

export const objectId = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid id");

const positionSchema = z.object({
  row: z.number().int().min(0).max(7),
  col: z.number().int().min(0).max(9),
});

export const lineupHeroSchema = z.object({
  hero: objectId,
  position: positionSchema,
  role: z.string().max(40).optional(),
  equipment: z.array(objectId).max(3, "Max 3 items per hero").default([]),
  note: z.string().max(300).optional(),
});

export const lineupSynergySchema = z.object({
  synergy: objectId,
  count: z.number().int().min(1).max(20),
});

export const strategySchema = z.object({
  earlyGame: z.string().max(5000).optional(),
  midGame: z.string().max(5000).optional(),
  lateGame: z.string().max(5000).optional(),
  economy: z.string().max(5000).optional(),
  leveling: z.string().max(5000).optional(),
  positioning: z.string().max(5000).optional(),
  tips: z.string().max(5000).optional(),
});

export const createLineupSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(120),
  description: z.string().max(2000).default(""),
  season: objectId,
  gameMode: objectId,
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  commander: objectId.nullable().optional(),
  commanderSkillName: z.string().max(120).optional(),
  recommendedCommanders: z.array(objectId).max(3, "Max 3 recommended commanders").default([]),
  gogoCards: z.array(objectId).max(10, "Max 10 gogo cards").default([]),
  heroes: z.array(lineupHeroSchema).min(1, "Add at least one hero").max(30),
  synergies: z.array(lineupSynergySchema).default([]),
  strategy: strategySchema.default({}),
  tags: z.array(z.string().trim().toLowerCase().min(1).max(24)).max(10).default([]),
  thumbnailUrl: z.string().url().nullable().optional(),
  thumbnailPublicId: z.string().optional(),
  status: z.enum(["draft", "published"]).default("published"),
});

export const updateLineupSchema = createLineupSchema.partial();

export const listLineupsSchema = z.object({
  q: z.string().trim().max(100).optional(),
  season: z.string().trim().optional(),
  gameMode: z.string().trim().optional(),
  commander: z.string().trim().optional(),
  synergy: z.string().trim().optional(),
  hero: z.string().trim().optional(),
  author: z.string().trim().optional(),
  tag: z.string().trim().optional(),
  difficulty: z
    .enum(["beginner", "intermediate", "advanced"])
    .optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  sort: z
    .enum(["trending", "likes", "views", "rating", "newest", "updated"])
    .default("trending"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(48).default(12),
});

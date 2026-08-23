import { z } from "zod";

const imageRef = z.object({
  url: z.string().url(),
  publicId: z.string().optional(),
});

export const seasonSchema = z.object({
  name: z.string().min(1).max(80),
  description: z.string().max(1000).default(""),
  number: z.number().int().optional(),
  isActive: z.boolean().default(true),
});

export const gameModeSchema = z.object({
  name: z.string().min(1).max(80),
  description: z.string().max(1000).default(""),
  boardConfig: z
    .object({
      rows: z.number().int().min(1).max(8).default(3),
      cols: z.number().int().min(1).max(10).default(7),
    })
    .partial()
    .optional(),
  isActive: z.boolean().default(true),
});

const optionalImage = z.string().url().max(500).optional();
const optionalPublicId = z.string().max(200).optional();

export const commanderSchema = z.object({
  name: z.string().min(1).max(80),
  type: z.string().max(60).default(""),
  image: optionalImage,
  imagePublicId: optionalPublicId,
  isActive: z.boolean().default(true),
});

export const synergySchema = z.object({
  name: z.string().min(1).max(80),
  image: optionalImage,
  imagePublicId: optionalPublicId,
  color: z.string().max(20).default("#8b5cf6"),
  type: z.enum(["faction", "role"]).default("faction"),
  activationLevels: z
    .array(
      z.object({ count: z.number().int().min(1), effect: z.string().max(500) }),
    )
    .default([]),
  isActive: z.boolean().default(true),
});

export const heroSchema = z.object({
  name: z.string().min(1).max(80),
  description: z.string().max(1000).default(""),
  image: optionalImage,
  imagePublicId: optionalPublicId,
  cost: z.number().int().min(1).max(9).default(1),
  synergies: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
});

export const equipmentSchema = z.object({
  name: z.string().min(1).max(80),
  description: z.string().max(1000).default(""),
  image: optionalImage,
  imagePublicId: optionalPublicId,
  tier: z.number().int().min(1).max(3).optional(),
  statType: z.enum(["attack", "magic", "defense", "utility"]).optional(),
  category: z
    .enum([
      "regular",
      "magic-crystal",
      "commander-exclusive",
      "synergy-exclusive",
      "special",
    ])
    .default("regular"),
  isActive: z.boolean().default(true),
});

export const gogoCardSchema = z.object({
  name: z.string().min(1).max(80),
  description: z.string().max(1000).default(""),
  image: optionalImage,
  imagePublicId: optionalPublicId,
  rarity: z.enum(["power", "orange", "purple", "blue"]),
  isActive: z.boolean().default(true),
});

export const bulkDeleteSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(200),
});

export const adminLineupStatusSchema = z.object({
  status: z.enum(["draft", "published", "hidden"]),
});

export const adminFeatureSchema = z.object({
  featured: z.boolean(),
});

export const adminUserStatusSchema = z.object({
  status: z.enum(["active", "banned"]),
});

export const adminResolveReportSchema = z.object({
  status: z.enum(["resolved", "dismissed"]),
  resolutionNote: z.string().max(1000).default(""),
});

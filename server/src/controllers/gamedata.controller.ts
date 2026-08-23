import { Request, Response } from "express";
import { Season } from "../models/season.model.js";
import { GameMode } from "../models/gameMode.model.js";
import { Commander } from "../models/commander.model.js";
import { Hero } from "../models/hero.model.js";
import { Synergy } from "../models/synergy.model.js";
import { Equipment } from "../models/equipment.model.js";
import { GoGoCard } from "../models/gogocard.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

export const getAllGameData = asyncHandler(
  async (_req: Request, res: Response) => {
    const [seasons, gameModes, commanders, heroes, synergies, equipment, gogoCards] =
      await Promise.all([
        Season.find({ isActive: true }).sort({ number: -1 }).lean(),
        GameMode.find({ isActive: true }).sort({ name: 1 }).lean(),
        Commander.find({ isActive: true }).sort({ name: 1 }).lean(),
        Hero.find({ isActive: true })
          .sort({ cost: -1, name: 1 })
          .populate("synergies", "name slug image color type")
          .lean(),
        Synergy.find({ isActive: true }).sort({ name: 1 }).lean(),
        Equipment.find({ isActive: true }).sort({ tier: -1, name: 1 }).lean(),
        GoGoCard.find({ isActive: true })
          .sort({ rarity: 1, name: 1 })
          .lean(),
      ]);

    res.set("Cache-Control", "no-store");
    res.json({
      success: true,
      data: {
        seasons,
        gameModes,
        commanders,
        heroes,
        synergies,
        equipment,
        gogoCards,
      },
    });
  },
);

const RESOURCES = {
  seasons: Season,
  "game-modes": GameMode,
  commanders: Commander,
  heroes: Hero,
  synergies: Synergy,
  equipment: Equipment,
  "gogo-cards": GoGoCard,
} as const;

export type ResourceKey = keyof typeof RESOURCES;

export function getResource(key: string) {
  return (RESOURCES as Record<string, unknown>)[key];
}

export const listResource = asyncHandler(
  async (req: Request, res: Response) => {
    const Model = getResource(req.params.entity);
    if (!Model) throw ApiError.notFound("Unknown resource");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items = await (Model as any).find().sort({ name: 1 }).lean();
    res.json({ success: true, data: { items } });
  },
);

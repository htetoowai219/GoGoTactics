import { Request, Response } from "express";
import { Lineup } from "../models/lineup.model.js";
import { Hero } from "../models/hero.model.js";
import { Commander } from "../models/commander.model.js";
import { Synergy } from "../models/synergy.model.js";
import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";

function escapeRx(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export const suggest = asyncHandler(async (req: Request, res: Response) => {
  const q = String(req.query.q || "").trim().toLowerCase();
  if (q.length < 2) {
    res.json({ success: true, data: { suggestions: [] } });
    return;
  }
  const rx = new RegExp(escapeRx(q), "i");

  const [lineups, heroes, commanders, synergies, users] = await Promise.all([
    Lineup.find({ status: "published", title: rx })
      .select("title slug thumbnail commander")
      .populate("commander", "name image")
      .limit(5)
      .lean(),
    Hero.find({ name: rx }).select("name slug image cost role").limit(4).lean(),
    Commander.find({ name: rx })
      .select("name slug image")
      .limit(3)
      .lean(),
    Synergy.find({ name: rx }).select("name slug image color").limit(3).lean(),
    User.find({ username: rx, status: "active" })
      .select("username avatar")
      .limit(3)
      .lean(),
  ]);

  res.json({
    success: true,
    data: {
      suggestions: [
        ...lineups.map((l) => ({
          type: "lineup" as const,
          id: String(l._id),
          label: l.title,
          slug: l.slug,
          image: l.thumbnail?.url ?? null,
        })),
        ...heroes.map((h) => ({
          type: "hero" as const,
          id: String(h._id),
          label: h.name,
          slug: h.slug,
          image: h.image ?? null,
          meta: `Hero · Cost ${h.cost}`,
        })),
        ...commanders.map((c) => ({
          type: "commander" as const,
          id: String(c._id),
          label: c.name,
          slug: c.slug,
          image: c.image ?? null,
          meta: "Commander",
        })),
        ...synergies.map((s) => ({
          type: "synergy" as const,
          id: String(s._id),
          label: s.name,
          slug: s.slug,
          image: s.image ?? null,
          meta: "Synergy",
        })),
        ...users.map((u) => ({
          type: "user" as const,
          id: String(u._id),
          label: u.username,
          slug: u.username,
          image: u.avatar?.url ?? null,
          meta: "Player",
        })),
      ],
    },
  });
});

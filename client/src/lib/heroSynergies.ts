import type { Hero, Synergy } from "../types";

type HeroLike = { synergies?: Hero["synergies"] };

function populatedSynergies(hero: HeroLike): Synergy[] {
  if (!Array.isArray(hero.synergies)) return [];
  return hero.synergies.filter(
    (s): s is Synergy => typeof s === "object" && s !== null,
  );
}

export function heroFaction(hero: HeroLike): Synergy | undefined {
  return populatedSynergies(hero).find((s) => s.type === "faction");
}

export function heroRoles(hero: HeroLike): Synergy[] {
  return populatedSynergies(hero).filter((s) => s.type === "role");
}

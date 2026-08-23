import type { Hero, Lineup, LineupDifficulty } from "../../../types";

export interface EditorStrategy {
  earlyGame: string;
  midGame: string;
  lateGame: string;
  economy: string;
  leveling: string;
  positioning: string;
  tips: string;
}

export type CommanderMode = "all" | "recommended";

export interface EditorState {
  seasonId: string;
  gameModeId: string;
  placements: Record<string, { row: number; col: number }>;
  equipmentByHero: Record<string, string[]>;
  commanderMode: CommanderMode;
  recommendedCommanders: string[];
  gogoCards: string[];
  title: string;
  description: string;
  difficulty: LineupDifficulty;
  tags: string[];
  strategy: EditorStrategy;
  thumbnailUrl: string | null;
  thumbnailPublicId?: string;
}

export const emptyEditorState: EditorState = {
  seasonId: "",
  gameModeId: "",
  placements: {},
  equipmentByHero: {},
  commanderMode: "all",
  recommendedCommanders: [],
  gogoCards: [],
  title: "",
  description: "",
  difficulty: "intermediate",
  tags: [],
  strategy: {
    earlyGame: "",
    midGame: "",
    lateGame: "",
    economy: "",
    leveling: "",
    positioning: "",
    tips: "",
  },
  thumbnailUrl: null,
};

export function heroIdsFromPlacements(
  placements: EditorState["placements"],
): string[] {
  return Object.keys(placements);
}

/** Count how many placed heroes share each synergy. */
export function computeSynergyCounts(
  placements: EditorState["placements"],
  heroById: Map<string, Hero>,
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const heroId of Object.keys(placements)) {
    const hero = heroById.get(heroId);
    if (!hero) continue;
    for (const syn of hero.synergies as unknown[]) {
      if (!syn || typeof syn === "string") continue;
      const synId = (syn as { _id?: string })._id;
      if (!synId) continue;
      counts.set(synId, (counts.get(synId) ?? 0) + 1);
    }
  }
  return counts;
}

export function validateBoard(state: EditorState): string | null {
  if (Object.keys(state.placements).length === 0)
    return "Place at least one hero on the board";
  if (!state.seasonId) return "Select a season first";
  if (!state.gameModeId) return "Select a game mode first";
  return null;
}

export function validateDetails(state: EditorState): string | null {
  if (state.title.trim().length < 3)
    return "Give your lineup a name (3+ characters)";
  return null;
}

export function toPayload(state: EditorState, status: "draft" | "published") {
  return {
    title: state.title.trim(),
    description: state.description,
    season: state.seasonId,
    gameMode: state.gameModeId,
    difficulty: state.difficulty,
    commander:
      state.commanderMode === "recommended" &&
      state.recommendedCommanders.length > 0
        ? state.recommendedCommanders[0]
        : null,
    recommendedCommanders:
      state.commanderMode === "recommended" ? state.recommendedCommanders : [],
    gogoCards: state.gogoCards,
    heroes: Object.entries(state.placements).map(([heroId, pos]) => ({
      hero: heroId,
      position: pos,
      equipment: state.equipmentByHero[heroId] ?? [],
    })),
    strategy: state.strategy,
    tags: state.tags,
    thumbnailUrl: state.thumbnailUrl,
    thumbnailPublicId: state.thumbnailPublicId,
    status,
  };
}

export function lineupToEditorState(lineup: Lineup): EditorState {
  return {
    seasonId: lineup.season._id,
    gameModeId: lineup.gameMode._id,
    placements: Object.fromEntries(
      lineup.heroes.map((h) => [
        h.hero._id,
        { row: h.position.row, col: h.position.col },
      ]),
    ),
    equipmentByHero: Object.fromEntries(
      lineup.heroes.map((h) => [
        h.hero._id,
        h.equipment.map((e) => e._id),
      ]),
    ),
    commanderMode:
      !lineup.commander && !(lineup.recommendedCommanders?.length ?? 0)
        ? "all"
        : "recommended",
    recommendedCommanders: lineup.commander
      ? [
          lineup.commander._id,
          ...(lineup.recommendedCommanders ?? [])
            .map((c) => c._id)
            .filter((id) => id !== lineup.commander!._id),
        ]
      : (lineup.recommendedCommanders ?? []).map((c) => c._id),
    gogoCards: (lineup.gogoCards ?? []).map((c) => c._id),
    title: lineup.title,
    description: lineup.description,
    difficulty: lineup.difficulty,
    tags: lineup.tags,
    strategy: {
      earlyGame: lineup.strategy.earlyGame ?? "",
      midGame: lineup.strategy.midGame ?? "",
      lateGame: lineup.strategy.lateGame ?? "",
      economy: lineup.strategy.economy ?? "",
      leveling: lineup.strategy.leveling ?? "",
      positioning: lineup.strategy.positioning ?? "",
      tips: lineup.strategy.tips ?? "",
    },
    thumbnailUrl: lineup.thumbnail?.url ?? null,
    thumbnailPublicId: lineup.thumbnail?.publicId,
  };
}

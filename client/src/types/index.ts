export interface ImageRef {
  url: string;
  publicId?: string;
}

export interface UserPublic {
  _id: string;
  username: string;
  avatar: ImageRef | null;
  bio?: string;
  role: "user" | "admin";
  followersCount: number;
  followingCount: number;
  lineupsCount?: number;
}

export interface Season {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  number?: number;
  isActive: boolean;
}

export interface GameMode {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  boardConfig: { rows: number; cols: number };
}

export interface Commander {
  _id: string;
  name: string;
  slug?: string;
  type?: string;
  image?: string;
  imagePublicId?: string;
}

export interface SynergyActivation {
  count: number;
  effect: string;
}

export type SynergyType = "faction" | "role";

export interface Synergy {
  _id: string;
  name: string;
  slug: string;
  image?: string;
  color?: string;
  type: SynergyType;
  activationLevels: SynergyActivation[];
}

export interface Hero {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  cost: number;
  synergies: Synergy[] | string[];
}

export type EquipmentCategory =
  | "regular"
  | "magic-crystal"
  | "commander-exclusive"
  | "synergy-exclusive"
  | "special";

export interface Equipment {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  tier?: number;
  statType?: "attack" | "magic" | "defense" | "utility";
  category?: EquipmentCategory;
}

export type GoGoCardRarity = "power" | "orange" | "purple" | "blue";

export interface GoGoCard {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  rarity: GoGoCardRarity;
}

export interface LineupHero {
  hero: Hero;
  position: { row: number; col: number };
  role?: string;
  equipment: Equipment[];
  note?: string;
}

export interface LineupSynergy {
  synergy: Synergy;
  count: number;
}

export interface LineupStrategy {
  earlyGame?: string;
  midGame?: string;
  lateGame?: string;
  economy?: string;
  leveling?: string;
  positioning?: string;
  tips?: string;
}

export type LineupDifficulty = "beginner" | "intermediate" | "advanced";
export type LineupStatus = "draft" | "published" | "hidden";

export interface Lineup {
  _id: string;
  title: string;
  slug: string;
  description: string;
  author: UserPublic;
  season: Pick<Season, "_id" | "name" | "slug">;
  gameMode: Pick<GameMode, "_id" | "name" | "slug"> & {
    boardConfig?: { rows: number; cols: number };
  };
  difficulty: LineupDifficulty;
  commander: Pick<Commander, "_id" | "name" | "slug" | "image"> | null;
  recommendedCommanders?: Pick<Commander, "_id" | "name" | "slug" | "image" | "type">[];
  gogoCards?: Pick<GoGoCard, "_id" | "name" | "slug" | "image" | "rarity" | "description">[];
  commanderSkill: { name: string; description?: string };
  heroes: LineupHero[];
  synergies: LineupSynergy[];
  strategy: LineupStrategy;
  tags: string[];
  thumbnail: ImageRef | null;
  likesCount: number;
  commentsCount: number;
  savesCount: number;
  viewsCount: number;
  averageRating: number;
  ratingsCount: number;
  ratingDistribution?: Record<string, number>;
  status: LineupStatus;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
  likedByViewer?: boolean;
  savedByViewer?: boolean;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface LineupListResponse {
  lineups: Lineup[];
  pagination: Pagination;
}

export interface GameDataBundle {
  seasons: Season[];
  gameModes: GameMode[];
  commanders: Commander[];
  heroes: Hero[];
  synergies: Synergy[];
  equipment: Equipment[];
  gogoCards: GoGoCard[];
}

export interface CommentAuthor {
  _id: string;
  username: string;
  avatar: ImageRef | null;
}

export interface CommentNode {
  _id: string;
  lineup: string;
  author: CommentAuthor;
  content: string;
  parentComment: string | null;
  likesCount: number;
  likedByViewer: boolean;
  isDeleted: boolean;
  createdAt: string;
  replies: CommentNode[];
}

export interface ReportItem {
  _id: string;
  reporter: CommentAuthor;
  targetType: "lineup" | "comment" | "user";
  targetId: string;
  reason: string;
  description?: string;
  status: "pending" | "resolved" | "dismissed";
  resolutionNote?: string;
  createdAt: string;
  resolvedAt?: string | null;
  target?: Record<string, unknown> | null;
}

export interface Suggestion {
  type: "lineup" | "hero" | "commander" | "synergy" | "user";
  id: string;
  label: string;
  slug: string;
  image: string | null;
  meta?: string;
}

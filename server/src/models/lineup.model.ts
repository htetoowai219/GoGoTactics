import mongoose, { Schema, model, Document, Types, Model } from "mongoose";

import { IImageRef } from "./user.model.js";

export const LINEUP_DIFFICULTIES = [
  "beginner",
  "intermediate",
  "advanced",
] as const;

export const LINEUP_STATUSES = ["draft", "published", "hidden"] as const;

export interface ILineupHero {
  hero: Types.ObjectId;
  position: { row: number; col: number };
  role?: string;
  equipment: Types.ObjectId[];
  note?: string;
}

export interface ILineupSynergy {
  synergy: Types.ObjectId;
  count: number;
}

export interface ILineupStrategy {
  earlyGame?: string;
  midGame?: string;
  lateGame?: string;
  economy?: string;
  leveling?: string;
  positioning?: string;
  tips?: string;
}

export interface ILineup extends Document<Types.ObjectId> {
  title: string;
  slug: string;
  description: string;
  author: Types.ObjectId;
  season: Types.ObjectId;
  gameMode: Types.ObjectId;
  difficulty: (typeof LINEUP_DIFFICULTIES)[number];
  commander?: Types.ObjectId | null;
  commanderSkill: { name: string; description?: string };
  recommendedCommanders: Types.ObjectId[];
  gogoCards: Types.ObjectId[];
  heroes: ILineupHero[];
  synergies: ILineupSynergy[];
  strategy: ILineupStrategy;
  tags: string[];
  thumbnail?: IImageRef | null;
  likesCount: number;
  commentsCount: number;
  savesCount: number;
  viewsCount: number;
  averageRating: number;
  ratingsCount: number;
  ratingDistribution: Map<number, number> | Record<number, number>;
  status: (typeof LINEUP_STATUSES)[number];
  featured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const lineupSchema = new Schema<ILineup>(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, unique: true },
    description: { type: String, default: "", maxlength: 2000 },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    season: { type: Schema.Types.ObjectId, ref: "Season", required: true },
    gameMode: { type: Schema.Types.ObjectId, ref: "GameMode", required: true },
    difficulty: {
      type: String,
      enum: LINEUP_DIFFICULTIES,
      default: "intermediate",
    },
    commander: {
      type: Schema.Types.ObjectId,
      ref: "Commander",
      default: null,
    },
    commanderSkill: {
      name: { type: String, default: "" },
      description: { type: String, default: "" },
    },
    recommendedCommanders: [
      {
        type: Schema.Types.ObjectId,
        ref: "Commander",
      },
    ],
    gogoCards: [
      {
        type: Schema.Types.ObjectId,
        ref: "GoGoCard",
      },
    ],
    heroes: [
      {
        _id: false,
        hero: { type: Schema.Types.ObjectId, ref: "Hero", required: true },
        position: {
          row: { type: Number, required: true, min: 0 },
          col: { type: Number, required: true, min: 0 },
        },
        role: { type: String },
        equipment: [{ type: Schema.Types.ObjectId, ref: "Equipment" }],
        note: { type: String, maxlength: 300 },
      },
    ],
    synergies: [
      {
        _id: false,
        synergy: {
          type: Schema.Types.ObjectId,
          ref: "Synergy",
          required: true,
        },
        count: { type: Number, required: true, min: 1 },
      },
    ],
    strategy: {
      earlyGame: { type: String, default: "" },
      midGame: { type: String, default: "" },
      lateGame: { type: String, default: "" },
      economy: { type: String, default: "" },
      leveling: { type: String, default: "" },
      positioning: { type: String, default: "" },
      tips: { type: String, default: "" },
    },
    tags: [{ type: String, lowercase: true, trim: true }],
    thumbnail: {
      type: {
        url: { type: String, required: true },
        publicId: String,
      },
      default: null,
    },
    likesCount: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
    savesCount: { type: Number, default: 0 },
    viewsCount: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    ratingsCount: { type: Number, default: 0 },
    ratingDistribution: {
      type: Map,
      of: Number,
      default: {},
    },
    status: {
      type: String,
      enum: LINEUP_STATUSES,
      default: "draft",
    },
    featured: { type: Boolean, default: false },
  },
  { timestamps: true },
);

lineupSchema.index({ title: "text", description: "text", tags: "text" });
lineupSchema.index({ status: 1, createdAt: -1 });
lineupSchema.index({ status: 1, updatedAt: -1 });
lineupSchema.index({ status: 1, likesCount: -1 });
lineupSchema.index({ status: 1, viewsCount: -1 });
lineupSchema.index({ status: 1, averageRating: -1 });
lineupSchema.index({ author: 1, status: 1 });
lineupSchema.index({ season: 1, status: 1 });
lineupSchema.index({ commander: 1 });
lineupSchema.index({ featured: 1, status: 1 });

export const Lineup: Model<ILineup> =
  (mongoose.models.Lineup as Model<ILineup>) || model<ILineup>("Lineup", lineupSchema);

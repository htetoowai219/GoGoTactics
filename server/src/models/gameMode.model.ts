import mongoose, { Schema, model, Document, Types, Model } from "mongoose";

export interface IBoardConfig {
  rows: number;
  cols: number;
}

export interface IGameMode extends Document<Types.ObjectId> {
  name: string;
  slug: string;
  description?: string;
  image?: string;
  isActive: boolean;
  boardConfig: IBoardConfig;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const gameModeSchema = new Schema<IGameMode>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, default: "" },
    image: { type: String },
    isActive: { type: Boolean, default: true },
    boardConfig: {
      rows: { type: Number, default: 3, min: 1, max: 8 },
      cols: { type: Number, default: 7, min: 1, max: 10 },
    },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

export const GameMode: Model<IGameMode> =
  (mongoose.models.GameMode as Model<IGameMode>) || model<IGameMode>("GameMode", gameModeSchema);

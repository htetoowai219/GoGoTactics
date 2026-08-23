import mongoose, { Schema, model, Document, Types, Model } from "mongoose";

export const GOGO_CARD_RARITIES = [
  "power",
  "orange",
  "purple",
  "blue",
] as const;

export type GoGoCardRarity = (typeof GOGO_CARD_RARITIES)[number];

export interface IGoGoCard extends Document<Types.ObjectId> {
  name: string;
  slug: string;
  description?: string;
  image?: string;
  imagePublicId?: string;
  rarity: GoGoCardRarity;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const gogoCardSchema = new Schema<IGoGoCard>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, default: "" },
    image: { type: String },
    imagePublicId: { type: String },
    rarity: {
      type: String,
      enum: GOGO_CARD_RARITIES,
      required: true,
      index: true,
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const GoGoCard: Model<IGoGoCard> =
  (mongoose.models.GoGoCard as Model<IGoGoCard>) ||
  model<IGoGoCard>("GoGoCard", gogoCardSchema);

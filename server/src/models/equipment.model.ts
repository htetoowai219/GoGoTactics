import mongoose, { Schema, model, Document, Types, Model } from "mongoose";

export const EQUIPMENT_CATEGORIES = [
  "regular",
  "magic-crystal",
  "commander-exclusive",
  "synergy-exclusive",
  "special",
] as const;

export type EquipmentCategory = (typeof EQUIPMENT_CATEGORIES)[number];

export interface IEquipment extends Document<Types.ObjectId> {
  name: string;
  slug: string;
  description?: string;
  image?: string;
  imagePublicId?: string;
  tier?: number;
  statType?: "attack" | "magic" | "defense" | "utility";
  category: EquipmentCategory;
  isActive: boolean;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const equipmentSchema = new Schema<IEquipment>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, default: "" },
    image: { type: String },
    imagePublicId: { type: String },
    tier: { type: Number, min: 1, max: 3 },
    statType: {
      type: String,
      enum: ["attack", "magic", "defense", "utility"],
    },
    category: {
      type: String,
      enum: EQUIPMENT_CATEGORIES,
      default: "regular",
      index: true,
    },
    isActive: { type: Boolean, default: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

export const Equipment: Model<IEquipment> =
  (mongoose.models.Equipment as Model<IEquipment>) || model<IEquipment>("Equipment", equipmentSchema);

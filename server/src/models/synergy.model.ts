import mongoose, { Schema, model, Document, Types, Model } from "mongoose";

export const SYNERGY_TYPES = ["faction", "role"] as const;

export type SynergyType = (typeof SYNERGY_TYPES)[number];

export interface ISynergyActivation {
  count: number;
  effect: string;
}

export interface ISynergy extends Document<Types.ObjectId> {
  name: string;
  slug: string;
  image?: string;
  imagePublicId?: string;
  color?: string;
  type: SynergyType;
  activationLevels: ISynergyActivation[];
  isActive: boolean;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const synergySchema = new Schema<ISynergy>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true },
    image: { type: String },
    imagePublicId: { type: String },
    color: { type: String, default: "#8b5cf6" },
    type: {
      type: String,
      enum: SYNERGY_TYPES,
      required: true,
      default: "faction",
      index: true,
    },
    activationLevels: [
      {
        _id: false,
        count: { type: Number, required: true },
        effect: { type: String, required: true },
      },
    ],
    isActive: { type: Boolean, default: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

export const Synergy: Model<ISynergy> =
  (mongoose.models.Synergy as Model<ISynergy>) || model<ISynergy>("Synergy", synergySchema);

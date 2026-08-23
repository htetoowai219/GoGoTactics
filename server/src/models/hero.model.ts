import mongoose, { Schema, model, Document, Types, Model } from "mongoose";

export interface IHero extends Document<Types.ObjectId> {
  name: string;
  slug: string;
  description?: string;
  image?: string;
  imagePublicId?: string;
  cost: number;
  synergies: Types.ObjectId[];
  isActive: boolean;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const heroSchema = new Schema<IHero>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, default: "" },
    image: { type: String },
    imagePublicId: { type: String },
    cost: { type: Number, min: 1, max: 9, default: 1 },
    synergies: [{ type: Schema.Types.ObjectId, ref: "Synergy" }],
    isActive: { type: Boolean, default: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

heroSchema.index({ name: 1 });
heroSchema.index({ cost: 1 });

export const Hero: Model<IHero> =
  (mongoose.models.Hero as Model<IHero>) || model<IHero>("Hero", heroSchema);

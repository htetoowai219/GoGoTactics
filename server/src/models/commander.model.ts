import mongoose, { Schema, model, Document, Types, Model } from "mongoose";

export interface ICommander extends Document<Types.ObjectId> {
  name: string;
  slug: string;
  type?: string;
  image?: string;
  imagePublicId?: string;
  isActive: boolean;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const commanderSchema = new Schema<ICommander>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true },
    type: { type: String, trim: true },
    image: { type: String },
    imagePublicId: { type: String },
    isActive: { type: Boolean, default: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

commanderSchema.index({ type: 1 });

export const Commander: Model<ICommander> =
  (mongoose.models.Commander as Model<ICommander>) || model<ICommander>("Commander", commanderSchema);

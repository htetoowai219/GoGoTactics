import mongoose, { Schema, model, Document, Types, Model } from "mongoose";

export interface ISeason extends Document<Types.ObjectId> {
  name: string;
  slug: string;
  description?: string;
  image?: string;
  number?: number;
  isActive: boolean;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const seasonSchema = new Schema<ISeason>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, default: "" },
    image: { type: String },
    number: { type: Number },
    isActive: { type: Boolean, default: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

export const Season: Model<ISeason> =
  (mongoose.models.Season as Model<ISeason>) || model<ISeason>("Season", seasonSchema);

import mongoose, { Schema, model, Document, Types, Model } from "mongoose";

export interface ISavedLineup extends Document<Types.ObjectId> {
  lineup: Types.ObjectId;
  user: Types.ObjectId;
  createdAt: Date;
}

const savedLineupSchema = new Schema<ISavedLineup>(
  {
    lineup: { type: Schema.Types.ObjectId, ref: "Lineup", required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

savedLineupSchema.index({ lineup: 1, user: 1 }, { unique: true });
savedLineupSchema.index({ user: 1, createdAt: -1 });

export const SavedLineup: Model<ISavedLineup> =
  (mongoose.models.SavedLineup as Model<ISavedLineup>) ||
  model<ISavedLineup>("SavedLineup", savedLineupSchema);

import mongoose, { Schema, model, Document, Types, Model } from "mongoose";

export interface IRating extends Document<Types.ObjectId> {
  lineup: Types.ObjectId;
  user: Types.ObjectId;
  rating: number;
  createdAt: Date;
  updatedAt: Date;
}

const ratingSchema = new Schema<IRating>(
  {
    lineup: {
      type: Schema.Types.ObjectId,
      ref: "Lineup",
      required: true,
    },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
  },
  { timestamps: true },
);

ratingSchema.index({ lineup: 1, user: 1 }, { unique: true });
ratingSchema.index({ lineup: 1 });

export const Rating: Model<IRating> =
  (mongoose.models.Rating as Model<IRating>) || model<IRating>("Rating", ratingSchema);

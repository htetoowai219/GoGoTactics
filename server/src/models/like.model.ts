import mongoose, { Schema, model, Document, Types, Model } from "mongoose";

export interface ILike extends Document<Types.ObjectId> {
  lineup: Types.ObjectId;
  user: Types.ObjectId;
  createdAt: Date;
}

const likeSchema = new Schema<ILike>(
  {
    lineup: { type: Schema.Types.ObjectId, ref: "Lineup", required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

likeSchema.index({ lineup: 1, user: 1 }, { unique: true });
likeSchema.index({ user: 1 });

export const Like: Model<ILike> =
  (mongoose.models.Like as Model<ILike>) || model<ILike>("Like", likeSchema);

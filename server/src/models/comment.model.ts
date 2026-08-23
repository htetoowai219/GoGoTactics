import mongoose, { Schema, model, Document, Types, Model } from "mongoose";

export interface IComment extends Document<Types.ObjectId> {
  lineup: Types.ObjectId;
  author: Types.ObjectId;
  content: string;
  parentComment?: Types.ObjectId | null;
  likedBy: Types.ObjectId[];
  likesCount: number;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema = new Schema<IComment>(
  {
    lineup: {
      type: Schema.Types.ObjectId,
      ref: "Lineup",
      required: true,
      index: true,
    },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true, trim: true, maxlength: 2000 },
    parentComment: {
      type: Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
    },
    likedBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
    likesCount: { type: Number, default: 0 },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

commentSchema.index({ lineup: 1, createdAt: -1 });
commentSchema.index({ parentComment: 1 });

export const Comment: Model<IComment> =
  (mongoose.models.Comment as Model<IComment>) || model<IComment>("Comment", commentSchema);

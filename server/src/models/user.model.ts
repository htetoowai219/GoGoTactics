import mongoose, { Schema, model, Document, Types, Model } from "mongoose";
import bcrypt from "bcryptjs";

export interface IImageRef {
  url: string;
  publicId?: string;
}

export interface IUser extends Document<Types.ObjectId> {
  username: string;
  email: string;
  passwordHash: string;
  avatar?: IImageRef | null;
  bio?: string;
  role: "user" | "admin";
  status: "active" | "banned";
  followers: Types.ObjectId[];
  following: Types.ObjectId[];
  comparePassword(candidate: string): Promise<boolean>;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 24,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    passwordHash: { type: String, required: true, select: false },
    avatar: {
      type: {
        url: { type: String, required: true },
        publicId: String,
      },
      default: null,
    },
    bio: { type: String, default: "", maxlength: 400 },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    status: { type: String, enum: ["active", "banned"], default: "active" },
    followers: [{ type: Schema.Types.ObjectId, ref: "User" }],
    following: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true },
);


userSchema.methods.comparePassword = function (
  candidate: string,
): Promise<boolean> {
  return bcrypt.compare(candidate, this.passwordHash);
};

userSchema.set("toJSON", {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transform(_doc, ret: any) {
    delete ret.passwordHash;
    delete ret.__v;
    return ret;
  },
});

export const User: Model<IUser> =
  (mongoose.models.User as Model<IUser>) || model<IUser>("User", userSchema);

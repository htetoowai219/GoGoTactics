import { Document, Types } from "mongoose";

export interface PublicUser {
  _id: string;
  username: string;
  avatar?: { url: string; publicId?: string } | null;
  bio?: string;
  role: string;
  followersCount: number;
  followingCount: number;
  lineupsCount?: number;
}

type UserLike = Pick<
  Document<Types.ObjectId>,
  "_id" | "toObject"
> & {
  username: string;
  avatar?: { url: string; publicId?: string } | null;
  bio?: string;
  role: string;
  followers?: Types.ObjectId[];
  following?: Types.ObjectId[];
};

export function toPublicUser(user: UserLike): PublicUser {
  return {
    _id: String(user._id),
    username: user.username,
    avatar: user.avatar ?? null,
    bio: user.bio ?? "",
    role: user.role,
    followersCount: user.followers?.length ?? 0,
    followingCount: user.following?.length ?? 0,
  };
}

import jwt from "jsonwebtoken";
import { Response } from "express";
import env from "../config/env.js";
import { Types } from "mongoose";

export function signToken(userId: Types.ObjectId | string): string {
  return jwt.sign({ sub: String(userId) }, env.JWT_SECRET, {
    expiresIn: `${env.JWT_EXPIRES_IN_DAYS}d`,
  });
}

export function setAuthCookie(res: Response, token: string): void {
  res.cookie("token", token, {
    httpOnly: true,
    secure: env.COOKIE_SECURE ?? env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: env.JWT_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000,
  });
}

export function clearAuthCookie(res: Response): void {
  res.clearCookie("token");
}

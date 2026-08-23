import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import env from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { Types } from "mongoose";

export interface AuthPayload {
  sub: string;
  role: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: {
        _id: Types.ObjectId;
        username: string;
        role: "user" | "admin";
        status: string;
      };
    }
  }
}

function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) return header.slice(7);
  if (req.cookies?.token) return req.cookies.token as string;
  return null;
}

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const token = extractToken(req);
    if (!token) {
      throw ApiError.unauthorized();
    }
    let payload: AuthPayload;
    try {
      payload = jwt.verify(token, env.JWT_SECRET) as AuthPayload;
    } catch {
      throw ApiError.unauthorized("Session expired, please log in again");
    }
    const user = await User.findById(payload.sub);
    if (!user) throw ApiError.unauthorized("Account no longer exists");
    if (user.status === "banned") {
      throw ApiError.forbidden(
        "This account has been banned. Contact an administrator if you believe this is a mistake.",
      );
    }
    req.user = {
      _id: user._id,
      username: user.username,
      role: user.role,
      status: user.status,
    };
    next();
  } catch (err) {
    next(err);
  }
}

export function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const token = extractToken(req);
  if (!token) return next();
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as AuthPayload;
    User.findById(payload.sub)
      .then((user) => {
        if (user && user.status !== "banned") {
          req.user = {
            _id: user._id,
            username: user.username,
            role: user.role,
            status: user.status,
          };
        }
        next();
      })
      .catch(next);
  } catch {
    next();
  }
}

export function requireAdmin(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  if (!req.user) return next(ApiError.unauthorized());
  if (req.user.role !== "admin") {
    return next(ApiError.forbidden("Admin access required"));
  }
  next();
}

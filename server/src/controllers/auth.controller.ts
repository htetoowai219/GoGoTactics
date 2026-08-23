import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { User } from "../models/user.model.js";
import { Lineup } from "../models/lineup.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { signToken, setAuthCookie, clearAuthCookie } from "../services/token.service.js";
import { toPublicUser } from "../utils/sanitizeUser.js";

export const register = asyncHandler(
  async (req: Request, res: Response) => {
    const { username, email, password } = req.body;

    const existing = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }],
    });
    if (existing) {
      throw ApiError.conflict(
        existing.email === email.toLowerCase()
          ? "An account with this email already exists"
          : "This username is already taken",
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      passwordHash,
    });

    const token = signToken(user._id);
    setAuthCookie(res, token);

    res.status(201).json({
      success: true,
      data: { user: toPublicUser(user) },
    });
  },
);

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { identifier, password } = req.body;
  const idLower = identifier.toLowerCase();

  const user = await User.findOne({
    $or: [{ email: idLower }, { username: idLower }],
  }).select("+passwordHash");

  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized("Invalid credentials");
  }
  if (user.status === "banned") {
    throw ApiError.forbidden("This account has been banned");
  }

  const token = signToken(user._id);
  setAuthCookie(res, token);

  res.json({ success: true, data: { user: toPublicUser(user) } });
});

export const logout = asyncHandler(async (_req: Request, res: Response) => {
  clearAuthCookie(res);
  res.json({ success: true, message: "Logged out" });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const user = await User.findById(req.user._id);
  if (!user) throw ApiError.notFound("User not found");

  const lineupsCount = await Lineup.countDocuments({
    author: user._id,
    status: "published",
  });

  res.json({
    success: true,
    data: { user: { ...toPublicUser(user), lineupsCount } },
  });
});

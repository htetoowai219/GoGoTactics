import { Request, Response } from "express";
import { Report } from "../models/report.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

export const createReport = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();

    const report = await Report.create({
      reporter: req.user._id,
      targetType: req.body.targetType,
      targetId: req.body.targetId,
      reason: req.body.reason,
      description: req.body.description || "",
    });

    res.status(201).json({
      success: true,
      message: "Report submitted. Our moderators will review it.",
      data: { report },
    });
  },
);

export const listMyReports = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const reports = await Report.find({ reporter: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ success: true, data: { reports } });
  },
);

import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadImage, deleteImage, UploadFolder } from "../services/upload.service.js";

const ALLOWED_FOLDERS: UploadFolder[] = ["avatars", "lineups", "game-data"];

export const uploadImageHandler = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    if (!req.file) throw ApiError.badRequest("No image file provided");

    const folder = ALLOWED_FOLDERS.includes(req.body.folder as UploadFolder)
      ? (req.body.folder as UploadFolder)
      : "lineups";
    const result = await uploadImage(req.file.buffer, folder);

    res.status(201).json({ success: true, data: result });
  },
);

export const deleteImageHandler = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const { publicId } = req.body as { publicId?: string };
    if (!publicId) throw ApiError.badRequest("publicId is required");
    await deleteImage(publicId);
    res.json({ success: true });
  },
);

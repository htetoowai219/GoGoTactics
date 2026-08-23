import cloudinary, { isCloudinaryConfigured } from "../config/cloudinary.js";
import { ApiError } from "../utils/ApiError.js";

export interface UploadedImage {
  url: string;
  publicId: string;
}

export type UploadFolder = "avatars" | "lineups" | "game-data";

const FOLDER_TRANSFORMS: Record<
  UploadFolder,
  Record<string, unknown>[]
> = {
  avatars: [
    { width: 256, height: 256, crop: "fill", gravity: "face" },
    { quality: "auto", fetch_format: "auto" },
  ],
  lineups: [
    { width: 1200, height: 675, crop: "limit" },
    { quality: "auto", fetch_format: "auto" },
  ],
  "game-data": [
    { width: 512, height: 512, crop: "fill" },
    { quality: "auto", fetch_format: "auto" },
  ],
};

export async function uploadImage(
  buffer: Buffer,
  folder: UploadFolder,
): Promise<UploadedImage> {
  if (!isCloudinaryConfigured()) {
    throw new ApiError(
      501,
      "Image uploads are not configured. Set CLOUDINARY_URL=cloudinary://<key>:<secret>@<cloud_name> (or the three CLOUDINARY_* keys) in server/.env.",
    );
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `gogotactics/${folder}`,
        resource_type: "image",
        transformation: FOLDER_TRANSFORMS[folder],
      },
      (error, result) => {
        if (error || !result) {
          reject(
            new ApiError(500, `Image upload failed: ${error?.message ?? ""}`),
          );
          return;
        }
        resolve({ url: result.secure_url, publicId: result.public_id });
      },
    );
    stream.end(buffer);
  });
}

export async function deleteImage(publicId: string): Promise<void> {
  if (!isCloudinaryConfigured() || !publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error("Cloudinary destroy failed:", err);
  }
}

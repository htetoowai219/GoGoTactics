import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ZodError } from "zod";

export function notFoundHandler(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  let statusCode = 500;
  let message = "Something went wrong on our end";
  let details: unknown;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    details = err.details;
  } else if (err instanceof ZodError) {
    statusCode = 400;
    message = "Invalid input";
    details = err.flatten().fieldErrors;
  } else if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    message = Object.values(err.errors)[0]?.message || "Validation failed";
    details = err.errors;
  } else if (err instanceof mongoose.Error.CastError) {
    statusCode = 404;
    message = `Resource not found`;
  } else if (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: number }).code === 11000
  ) {
    statusCode = 409;
    const fields = Object.keys(
      (err as { keyValue?: Record<string, unknown> }).keyValue ?? {},
    );
    message = `Duplicate value for: ${fields.join(", ") || "unique field"}`;
  } else if (err instanceof Error) {
    if (req.path.startsWith("/api")) {
      console.error(`[error] ${req.method} ${req.path}:`, err.message);
    }
    if (err.message.includes("File too large")) {
      statusCode = 413;
      message = "File is too large (max 5MB)";
    } else if (err.message.includes("Only image files")) {
      statusCode = 400;
      message = "Only image files are allowed";
    }
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(details ? { details } : {}),
    ...(process.env.NODE_ENV === "development" && statusCode === 500
      ? { stack: err instanceof Error ? err.stack : undefined }
      : {}),
  });
}

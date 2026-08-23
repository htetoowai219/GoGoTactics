import { Request, Response, NextFunction } from "express";
import { AnyZodObject, ZodError } from "zod";
import { ApiError } from "../utils/ApiError.js";

export function validate(schema: AnyZodObject) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const details = err.flatten().fieldErrors;
        const first = Object.values(details)[0]?.[0];
        next(new ApiError(400, first || "Invalid input", details));
      } else {
        next(err);
      }
    }
  };
}

import mongoose, { Schema, model, Document, Types, Model } from "mongoose";

export const REPORT_TARGET_TYPES = ["lineup", "comment", "user"] as const;
export const REPORT_REASONS = [
  "spam",
  "incorrect_information",
  "offensive_content",
  "misleading_content",
  "other",
] as const;
export const REPORT_STATUSES = ["pending", "resolved", "dismissed"] as const;

export interface IReport extends Document<Types.ObjectId> {
  reporter: Types.ObjectId;
  targetType: (typeof REPORT_TARGET_TYPES)[number];
  targetId: Types.ObjectId;
  reason: (typeof REPORT_REASONS)[number];
  description?: string;
  status: (typeof REPORT_STATUSES)[number];
  resolvedBy?: Types.ObjectId | null;
  resolutionNote?: string;
  createdAt: Date;
  resolvedAt?: Date | null;
}

const reportSchema = new Schema<IReport>(
  {
    reporter: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    targetType: {
      type: String,
      enum: REPORT_TARGET_TYPES,
      required: true,
    },
    targetId: { type: Schema.Types.ObjectId, required: true },
    reason: { type: String, enum: REPORT_REASONS, required: true },
    description: { type: String, maxlength: 1000 },
    status: {
      type: String,
      enum: REPORT_STATUSES,
      default: "pending",
      index: true,
    },
    resolvedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    resolutionNote: { type: String, default: "" },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ targetType: 1, targetId: 1 });

export const Report: Model<IReport> =
  (mongoose.models.Report as Model<IReport>) || model<IReport>("Report", reportSchema);

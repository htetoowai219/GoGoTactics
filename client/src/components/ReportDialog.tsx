import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Flag } from "lucide-react";
import { reportsApi, getApiErrorMessage } from "../api/endpoints";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { cn } from "../lib/utils";

const REASONS = [
  { value: "spam", label: "Spam" },
  { value: "incorrect_information", label: "Incorrect information" },
  { value: "offensive_content", label: "Offensive content" },
  { value: "misleading_content", label: "Misleading content" },
  { value: "other", label: "Other" },
];

interface ReportDialogProps {
  targetType: "lineup" | "comment" | "user";
  targetId: string;
  trigger?: React.ReactNode;
}

export function ReportDialog({ targetType, targetId, trigger }: ReportDialogProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      reportsApi.create({
        targetType,
        targetId,
        reason,
        description: description || undefined,
      }),
    onSuccess: () => {
      toast.success("Report submitted — moderators will review it.");
      setOpen(false);
      setReason("");
      setDescription("");
    },
    onError: (err) => toast.error(getApiErrorMessage(err, "Could not submit report")),
  });

  return (
    <>
      <span onClick={() => setOpen(true)} className="cursor-pointer">
        {trigger ?? (
          <Button variant="ghost" size="sm">
            <Flag /> Report
          </Button>
        )}
      </span>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="capitalize">Report this {targetType}</DialogTitle>
            <DialogDescription>
              Tell our moderators what's wrong. Reports are anonymous to the reported user.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Reason</Label>
              <div className="flex flex-wrap gap-2">
                {REASONS.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setReason(r.value)}
                    className={cn(
                      "rounded-lg border px-3 py-1.5 text-sm transition-colors cursor-pointer",
                      reason === r.value
                        ? "border-primary bg-primary/15 text-foreground"
                        : "border-border bg-surface text-muted hover:text-foreground",
                    )}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="report-desc">Details (optional)</Label>
              <Textarea
                id="report-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add any context that helps moderators…"
                maxLength={1000}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!reason || mutation.isPending}
              onClick={() => mutation.mutate()}
            >
              {mutation.isPending ? "Submitting…" : "Submit report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

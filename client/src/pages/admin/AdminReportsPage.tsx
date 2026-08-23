import { useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2, XCircle } from "lucide-react";
import { adminApi, getApiErrorMessage } from "../../api/endpoints";
import type { ReportItem } from "../../types";
import { Seo } from "../../components/Seo";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Textarea } from "../../components/ui/textarea";
import { formatDate } from "../../lib/utils";

const STATUS_TABS = [
  { value: "pending", label: "Pending" },
  { value: "resolved", label: "Resolved" },
  { value: "dismissed", label: "Dismissed" },
] as const;

function TargetPreview({ report }: { report: ReportItem }) {
  const target = report.target as
    | { title?: string; slug?: string; username?: string; content?: string }
    | null
    | undefined;

  if (!target) return <span className="text-muted">target unavailable</span>;

  if (report.targetType === "lineup" && target.slug) {
    return (
      <a href={`/lineups/${target.slug}`} target="_blank" rel="noreferrer" className="text-accent hover:underline">
        {target.title ?? "View lineup"}
      </a>
    );
  }
  if (report.targetType === "user" && target.username) {
    return (
      <a href={`/users/${target.username}`} target="_blank" rel="noreferrer" className="text-accent hover:underline">
        @{target.username}
      </a>
    );
  }
  return <span className="italic text-muted">“{(target.content ?? "").slice(0, 120)}”</span>;
}

export default function AdminReportsPage() {
  const [status, setStatus] = useState<string>("pending");
  const [page, setPage] = useState(1);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["admin-reports", status, page],
    queryFn: async () => {
      const res = await adminApi.reports(status, page);
      return res.data.data;
    },
    placeholderData: keepPreviousData,
  });

  const resolveMutation = useMutation({
    mutationFn: ({
      id,
      next,
      note,
    }: {
      id: string;
      next: "resolved" | "dismissed";
      note?: string;
    }) => adminApi.resolveReport(id, next, note),
    onSuccess: (_d, vars) => {
      toast.success(vars.next === "resolved" ? "Report resolved" : "Report dismissed");
      void queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  return (
    <>
      <Seo title="Admin · Reports" noIndex />
      <h1 className="mb-4 text-xl font-bold">Reports</h1>

      <div className="mb-4 flex gap-1.5">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => {
              setStatus(tab.value);
              setPage(1);
            }}
            className={`cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              status === tab.value
                ? "bg-primary/20 text-foreground"
                : "text-muted hover:bg-elevated hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {query.isLoading ? (
        <p className="py-10 text-center text-muted">Loading…</p>
      ) : !query.data || query.data.reports.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-10 text-center text-muted">
          Queue is clear. 🎉
        </p>
      ) : (
        <div className="space-y-3">
          {query.data.reports.map((report: ReportItem) => (
            <article key={report._id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="capitalize">{report.targetType}</Badge>
                <Badge variant="outline">{report.reason}</Badge>
                <Badge
                  variant={
                    report.status === "pending"
                      ? "cyan"
                      : report.status === "resolved"
                        ? "success"
                        : "secondary"
                  }
                  className="capitalize"
                >
                  {report.status}
                </Badge>
                <span className="ml-auto text-xs text-muted">
                  by @{report.reporter.username} · {formatDate(report.createdAt)}
                </span>
              </div>

              <p className="mt-2 text-sm">
                Target: <TargetPreview report={report} />
              </p>
              {report.description && (
                <blockquote className="mt-2 border-l-2 border-border pl-3 text-sm text-muted">
                  “{report.description}”
                </blockquote>
              )}

              {report.status === "pending" && (
                <div className="mt-3 space-y-2">
                  <Textarea
                    placeholder="Resolution note (optional)…"
                    value={notes[report._id] ?? ""}
                    onChange={(e) =>
                      setNotes((prev) => ({ ...prev, [report._id]: e.target.value }))
                    }
                    className="min-h-16"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      disabled={resolveMutation.isPending}
                      onClick={() =>
                        resolveMutation.mutate({
                          id: report._id,
                          next: "resolved",
                          note: notes[report._id],
                        })
                      }
                    >
                      <CheckCircle2 /> Resolve
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={resolveMutation.isPending}
                      onClick={() =>
                        resolveMutation.mutate({ id: report._id, next: "dismissed", note: notes[report._id] })
                      }
                    >
                      <XCircle /> Dismiss
                    </Button>
                  </div>
                </div>
              )}
              {report.resolutionNote && (
                <p className="mt-2 text-xs text-muted">
                  Moderator note: {report.resolutionNote}
                </p>
              )}
            </article>
          ))}
        </div>
      )}

      {query.data && query.data.pagination.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Previous
          </Button>
          <span className="text-sm text-muted">
            Page {query.data.pagination.page} / {query.data.pagination.totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={page >= query.data.pagination.totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </>
  );
}

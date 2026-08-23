import { useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { EyeOff, Star, Trash2, RotateCcw } from "lucide-react";
import { adminApi, getApiErrorMessage } from "../../api/endpoints";
import { Seo } from "../../components/Seo";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";

export default function AdminLineupsPage() {
  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["admin-lineups", status, q, page],
    queryFn: async () => {
      const res = await adminApi.lineups({ status: status === "all" ? undefined : status, q, page });
      return res.data.data;
    },
    placeholderData: keepPreviousData,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["admin-lineups"] });

  const statusMutation = useMutation({
    mutationFn: ({ id, next }: { id: string; next: string }) =>
      adminApi.setLineupStatus(id, next),
    onSuccess: (_d, vars) => {
      toast.success(`Lineup ${vars.next}`);
      void invalidate();
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const featureMutation = useMutation({
    mutationFn: ({ id, featured }: { id: string; featured: boolean }) =>
      adminApi.setLineupFeatured(id, featured),
    onSuccess: () => {
      toast.success("Updated");
      void invalidate();
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteLineup(id),
    onSuccess: () => {
      toast.success("Lineup deleted");
      void invalidate();
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  return (
    <>
      <Seo title="Admin · Lineups" noIndex />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Lineups</h1>
        <div className="flex gap-2">
          <Input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="Search titles…"
            className="w-48"
          />
          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="hidden">Hidden</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {query.isLoading ? (
        <p className="py-10 text-center text-muted">Loading…</p>
      ) : !query.data || query.data.lineups.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-10 text-center text-muted">
          No lineups match.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted">
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Author</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Stats</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {query.data.lineups.map((lineup) => (
                <tr key={lineup._id} className="hover:bg-elevated/40">
                  <td className="max-w-[240px] px-4 py-3">
                    <a href={`/lineups/${lineup.slug}`} className="line-clamp-1 font-medium hover:text-accent" target="_blank" rel="noreferrer">
                      {lineup.title}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-muted">@{(lineup.author as { username?: string }).username}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-md px-2 py-0.5 text-xs font-medium capitalize ${
                        lineup.status === "published"
                          ? "bg-success/10 text-emerald-300"
                          : lineup.status === "hidden"
                            ? "bg-danger/10 text-rose-300"
                            : "bg-elevated text-muted"
                      }`}
                    >
                      {lineup.status}
                    </span>
                    {lineup.featured && (
                      <span className="ml-1.5 rounded-md bg-gold/15 px-1.5 py-0.5 text-xs text-amber-300">★</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted">
                    ♥ {lineup.likesCount} · ☁ {lineup.savesCount} · 👁 {lineup.viewsCount} · ★ {lineup.averageRating.toFixed(1)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="ghost"
                        title={lineup.featured ? "Unfeature" : "Feature"}
                        onClick={() =>
                          featureMutation.mutate({ id: lineup._id, featured: !lineup.featured })
                        }
                      >
                        <Star className={lineup.featured ? "fill-gold text-gold" : ""} />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        title={lineup.status === "hidden" ? "Publish" : "Hide"}
                        onClick={() =>
                          statusMutation.mutate({
                            id: lineup._id,
                            next: lineup.status === "hidden" ? "published" : "hidden",
                          })
                        }
                      >
                        {lineup.status === "hidden" ? <RotateCcw /> : <EyeOff />}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-danger hover:text-danger"
                        title="Delete"
                        onClick={() => {
                          if (window.confirm(`Delete "${lineup.title}" permanently?`))
                            deleteMutation.mutate(lineup._id);
                        }}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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

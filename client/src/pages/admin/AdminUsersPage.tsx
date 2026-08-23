import { useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Ban, RotateCcw, Search, ShieldCheck } from "lucide-react";
import { adminApi, getApiErrorMessage } from "../../api/endpoints";
import type { UserPublic } from "../../types";
import { Seo } from "../../components/Seo";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";

type AdminUser = UserPublic & { email: string; status: string; joinedAt: string };

export default function AdminUsersPage() {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["admin-users", q, page],
    queryFn: async () => {
      const res = await adminApi.users({ q: q || undefined, page });
      return res.data.data;
    },
    placeholderData: keepPreviousData,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "active" | "banned" }) =>
      adminApi.setUserStatus(id, status),
    onSuccess: (_d, vars) => {
      toast.success(vars.status === "banned" ? "User banned" : "User unbanned");
      void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  return (
    <>
      <Seo title="Admin · Users" noIndex />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Users</h1>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="Search username or email…"
            className="w-64 pl-8"
          />
        </div>
      </div>

      {query.isLoading ? (
        <p className="py-10 text-center text-muted">Loading…</p>
      ) : !query.data || query.data.users.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-10 text-center text-muted">
          No users found.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted">
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {query.data.users.map((user: AdminUser) => (
                <tr key={user._id} className="hover:bg-elevated/40">
                  <td className="px-4 py-3 font-medium">@{user.username}</td>
                  <td className="px-4 py-3 text-muted">{user.email}</td>
                  <td className="px-4 py-3">
                    {user.role === "admin" ? (
                      <span className="inline-flex items-center gap-1 text-xs text-amber-300">
                        <ShieldCheck className="h-3.5 w-3.5" /> admin
                      </span>
                    ) : (
                      <span className="text-xs text-muted">user</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                        user.status === "active"
                          ? "bg-success/10 text-emerald-300"
                          : "bg-danger/10 text-rose-300"
                      }`}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {user.role !== "admin" &&
                      (user.status === "active" ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-danger hover:text-danger"
                          onClick={() => {
                            if (window.confirm(`Ban @${user.username}? They won't be able to log in.`))
                              statusMutation.mutate({ id: user._id, status: "banned" });
                          }}
                        >
                          <Ban /> Ban
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => statusMutation.mutate({ id: user._id, status: "active" })}
                        >
                          <RotateCcw /> Unban
                        </Button>
                      ))}
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

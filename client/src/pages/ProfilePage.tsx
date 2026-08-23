import { useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CalendarDays, UserCheck, UserPlus, Pencil } from "lucide-react";
import { Link } from "react-router-dom";
import { usersApi, getApiErrorMessage } from "../api/endpoints";
import type { Lineup } from "../types";
import { LineupCard } from "../components/LineupCard";
import { LineupGridSkeleton } from "../components/LineupGridSkeleton";
import { EmptyState } from "../components/EmptyState";
import { ErrorState } from "../components/ErrorState";
import { Seo } from "../components/Seo";
import { ReportDialog } from "../components/ReportDialog";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { useAuthStore } from "../stores/authStore";
import { formatDate } from "../lib/utils";

export default function ProfilePage() {
  const { username = "" } = useParams();
  const viewer = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  const profileQuery = useQuery({
    queryKey: ["profile", username],
    queryFn: async () => {
      const res = await usersApi.profile(username);
      return res.data.data;
    },
    retry: false,
  });

  const lineupsQuery = useQuery({
    queryKey: ["profile-lineups", username, page],
    queryFn: async () => {
      const res = await usersApi.lineups(username, page);
      return res.data.data;
    },
    enabled: Boolean(profileQuery.data),
  });

  const followMutation = useMutation({
    mutationFn: async () => {
      if (!viewer) throw new Error("auth");
      if (!profileQuery.data) return;
      if (profileQuery.data.isFollowing) await usersApi.unfollow(profileQuery.data.user._id);
      else await usersApi.follow(profileQuery.data.user._id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["profile", username] });
    },
    onError: (err) => {
      if ((err as Error).message === "auth") toast.error("Log in to follow creators");
      else toast.error(getApiErrorMessage(err));
    },
  });

  if (profileQuery.isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-6">
          <Avatar className="h-20 w-20"><AvatarFallback>…</AvatarFallback></Avatar>
          <div className="space-y-2">
            <div className="h-6 w-40 animate-pulse rounded bg-elevated" />
            <div className="h-4 w-64 animate-pulse rounded bg-elevated" />
          </div>
        </div>
        <LineupGridSkeleton count={3} />
      </div>
    );
  }

  if (profileQuery.isError || !profileQuery.data) {
    return (
      <ErrorState
        message="This player doesn't exist."
        onRetry={() => void profileQuery.refetch()}
      />
    );
  }

  const { user, isSelf, isFollowing } = profileQuery.data;

  return (
    <>
      <Seo
        title={`@${user.username}`}
        description={user.bio || `Lineups by @${user.username} on GoGoTactics`}
        pathname={`/users/${user.username}`}
      />

      <header className="flex flex-col gap-5 rounded-xl border border-border bg-card p-6 sm:flex-row sm:items-center">
        <Avatar className="h-20 w-20 text-xl">
          {user.avatar?.url ? (
            <AvatarImage src={user.avatar.url} alt={user.username} />
          ) : null}
          <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold tracking-tight">@{user.username}</h1>
          {user.bio && <p className="mt-1 max-w-xl text-sm text-muted">{user.bio}</p>}
          <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" /> Joined {formatDate(user.joinedAt)}
            </span>
            <span><strong className="text-foreground">{user.followersCount}</strong> followers</span>
            <span><strong className="text-foreground">{user.followingCount}</strong> following</span>
            <span><strong className="text-foreground">{user.lineupsCount ?? 0}</strong> lineups</span>
            {user.role === "admin" && (
              <span className="rounded bg-primary px-1.5 py-0.5 font-bold uppercase border-2 border-foreground">admin</span>
            )}
          </p>
        </div>

        <div className="flex shrink-0 gap-2">
          {isSelf ? (
            <Button variant="secondary" asChild>
              <Link to="/settings"><Pencil /> Edit profile</Link>
            </Button>
          ) : (
            <>
              <Button
                variant={isFollowing ? "secondary" : "default"}
                onClick={() => followMutation.mutate()}
                disabled={followMutation.isPending}
              >
                {isFollowing ? <UserCheck /> : <UserPlus />}
                {isFollowing ? "Following" : "Follow"}
              </Button>
              {viewer && (
                <ReportDialog targetType="user" targetId={user._id} trigger={
                  <Button variant="ghost" size="sm" className="text-muted">Report</Button>
                } />
              )}
            </>
          )}
        </div>
      </header>

      <Tabs defaultValue="lineups" className="mt-6">
        <TabsList>
          <TabsTrigger value="lineups">Lineups</TabsTrigger>
        </TabsList>
        <TabsContent value="lineups">
          {lineupsQuery.isLoading ? (
            <LineupGridSkeleton count={3} />
          ) : !lineupsQuery.data || lineupsQuery.data.lineups.length === 0 ? (
            <EmptyState
              title="No published lineups yet"
              description={
                isSelf
                  ? "Share your first build with the community!"
                  : `@${user.username} hasn't published any lineups yet.`
              }
              action={isSelf ? { label: "Create a lineup", to: "/create-lineup" } : undefined}
            />
          ) : (
            <>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {lineupsQuery.data.lineups.map((lineup: Lineup) => (
                  <LineupCard key={lineup._id} lineup={lineup} />
                ))}
              </div>
              {lineupsQuery.data.pagination.totalPages > 1 && (
                <div className="mt-6 flex justify-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                  >
                    Previous
                  </Button>
                  <span className="px-2 py-1.5 text-sm text-muted">
                    Page {page} / {lineupsQuery.data.pagination.totalPages}
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page >= lineupsQuery.data.pagination.totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </>
  );
}

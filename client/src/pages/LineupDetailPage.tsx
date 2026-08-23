import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Bookmark,
  Calendar,
  Eye,
  Heart,
  Loader2,
  Pencil,
  MessageSquare,
  Star,
  Trash2,
  Shield,
  Sparkles,
  Zap,
} from "lucide-react";
import { commentsApi, lineupsApi, getApiErrorMessage } from "../api/endpoints";
import type { CommentNode } from "../types";
import { Seo } from "../components/Seo";
import { Board, RAINBOW_GRADIENT, costColor, type BoardCellData } from "../components/Board";
import { Markdown } from "../components/Markdown";
import { ShareButton } from "../components/ShareButton";
import { ReportDialog } from "../components/ReportDialog";
import { CommentThread } from "../components/comments/CommentThread";
import { StarRating } from "../components/StarRating";
import { ErrorState } from "../components/ErrorState";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Skeleton } from "../components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Separator } from "../components/ui/separator";
import { useAuthStore } from "../stores/authStore";
import { cn, formatCount, formatDate, timeAgo } from "../lib/utils";

const DIFFICULTY_VARIANT = {
  beginner: "success",
  intermediate: "cyan",
  advanced: "danger",
} as const;

export default function LineupDetailPage() {
  const { slug = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [commentPage, setCommentPage] = useState(1);

  const detailQuery = useQuery({
    queryKey: ["lineup", slug],
    queryFn: async () => {
      const res = await lineupsApi.bySlug(slug);
      return res.data.data;
    },
    retry: (count, error) => {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 404) return false;
      return count < 2;
    },
  });

  const lineup = detailQuery.data?.lineup;
  const detail = detailQuery.data;

  const commentsQuery = useQuery({
    queryKey: ["comments", lineup?._id, commentPage],
    queryFn: async () => {
      const res = await commentsApi.list(lineup!._id, commentPage);
      return res.data.data;
    },
    enabled: Boolean(lineup?._id),
  });

  useEffect(() => {
    if (!lineup) return;
    void lineupsApi.trackView(lineup._id).catch(() => undefined);
  }, [lineup]);

  const invalidateLineup = () =>
    queryClient.invalidateQueries({ queryKey: ["lineup", slug] });

  const likeMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("auth");
      if (!lineup) return;
      if (lineup.likedByViewer) await lineupsApi.unlike(lineup._id);
      else await lineupsApi.like(lineup._id);
    },
    onSuccess: () => void invalidateLineup(),
    onError: (err) => {
      if ((err as Error).message === "auth") toast.error("Log in to like lineups");
      else toast.error(getApiErrorMessage(err));
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user || !lineup) throw new Error("auth");
      if (lineup.savedByViewer) await lineupsApi.unsave(lineup._id);
      else await lineupsApi.save(lineup._id);
    },
    onSuccess: () => void invalidateLineup(),
    onError: (err) => {
      if ((err as Error).message === "auth") toast.error("Log in to save lineups");
      else toast.error(getApiErrorMessage(err));
    },
  });

  const rateMutation = useMutation({
    mutationFn: (rating: number) => lineupsApi.rate(lineup!._id, rating),
    onSuccess: () => {
      toast.success("Rating saved");
      void invalidateLineup();
    },
    onError: (err) => {
      if (!user) toast.error("Log in to rate lineups");
      else toast.error(getApiErrorMessage(err));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => lineupsApi.remove(lineup!._id),
    onSuccess: () => {
      toast.success("Lineup deleted");
      navigate("/lineups");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const boardCells = useMemo(() => {
    const map = new Map<string, BoardCellData>();
    for (const h of lineup?.heroes ?? []) {
      map.set(`${h.position.row}-${h.position.col}`, {
        hero: h.hero,
        note: h.note,
        equipment: h.equipment ?? [],
      });
    }
    return map;
  }, [lineup]);

  if (detailQuery.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 w-full" />
        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <Skeleton className="h-96 w-full" />
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (detailQuery.isError || !lineup) {
    return (
      <ErrorState
        message={
          (detailQuery.error as { response?: { status?: number } })?.response?.status === 404
            ? "This lineup doesn't exist or is no longer published."
            : undefined
        }
        onRetry={() => void detailQuery.refetch()}
      />
    );
  }

  const rows = lineup.gameMode?.boardConfig?.rows ?? 3;
  const cols = lineup.gameMode?.boardConfig?.cols ?? 7;
  const distribution = lineup.ratingDistribution ?? {};
  const maxDist = Math.max(1, ...Object.values(distribution).map(Number));

  const strategySections = [
    ["earlyGame", "Early game"],
    ["midGame", "Mid game"],
    ["lateGame", "Late game"],
    ["economy", "Economy"],
    ["leveling", "Leveling"],
    ["positioning", "Positioning"],
    ["tips", "Important tips"],
  ] as const;
  const filledStrategy = strategySections.filter(
    ([key]) => lineup.strategy?.[key]?.trim(),
  );

  return (
    <>
      <Seo
        title={lineup.title}
        description={lineup.description.slice(0, 160)}
        image={lineup.thumbnail?.url}
        type="article"
        pathname={`/lineups/${lineup.slug}`}
      />

      {/* Header */}
      <header className="rounded-xl border border-border bg-card p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-1.5 text-xs">
              <Badge variant="secondary">{lineup.season.name}</Badge>
              <Badge variant="cyan">{lineup.gameMode.name}</Badge>
              <Badge variant={DIFFICULTY_VARIANT[lineup.difficulty]} className="capitalize">
                {lineup.difficulty}
              </Badge>
              {lineup.status !== "published" && (
                <Badge variant="danger" className="capitalize">{lineup.status}</Badge>
              )}
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{lineup.title}</h1>

            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
              <Link
                to={`/users/${lineup.author.username}`}
                className="flex items-center gap-1.5 hover:text-accent"
              >
                <Avatar className="h-6 w-6">
                  {lineup.author.avatar?.url ? (
                    <AvatarImage src={lineup.author.avatar.url} />
                  ) : null}
                  <AvatarFallback>{lineup.author.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                @{lineup.author.username}
              </Link>
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" /> {formatDate(lineup.createdAt)}
              </span>
              {lineup.updatedAt !== lineup.createdAt && (
                <span title={`Updated ${timeAgo(lineup.updatedAt)}`}>
                  · updated {timeAgo(lineup.updatedAt)}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" /> {formatCount(lineup.viewsCount)} views
              </span>
            </div>

            {lineup.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {lineup.tags.map((tag) => (
                  <Link key={tag} to={`/lineups?tag=${tag}`}>
                    <Badge variant="outline" className="hover:border-accent/50">#{tag}</Badge>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                variant={lineup.likedByViewer ? "default" : "secondary"}
                size="sm"
                onClick={() => likeMutation.mutate()}
                disabled={likeMutation.isPending}
              >
                <Heart className={cn(lineup.likedByViewer && "fill-current")} />
                {formatCount(lineup.likesCount)}
              </Button>
              <Button
                variant={lineup.savedByViewer ? "default" : "secondary"}
                size="sm"
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
              >
                <Bookmark className={cn(lineup.savedByViewer && "fill-current")} />
                {lineup.savedByViewer ? "Saved" : "Save"}
              </Button>
              <ShareButton title={lineup.title} />
            </div>
            {(detail!.isAuthor || user?.role === "admin") && (
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => navigate(`/lineups/${lineup._id}/edit`)}>
                  <Pencil /> Edit
                </Button>
                {user?.role === "admin" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-danger hover:text-danger"
                    onClick={() => {
                      if (window.confirm("Delete this lineup permanently?")) deleteMutation.mutate();
                    }}
                  >
                    <Trash2 /> Delete
                  </Button>
                )}
              </div>
            )}
            {!detail!.isAuthor && (
              <ReportDialog targetType="lineup" targetId={lineup._id} trigger={
                <Button variant="ghost" size="sm" className="text-muted hover:text-foreground">
                  Report
                </Button>
              } />
            )}
          </div>
        </div>

        {lineup.description && (
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted">
            {lineup.description}
          </p>
        )}
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Main column */}
        <div className="min-w-0 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Main board
                <span className="text-xs font-normal text-muted">
                  ({rows}×{cols})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Board rows={rows} cols={cols} cells={boardCells} />

              <Separator className="my-5" />

              <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
                {lineup.heroes.map((h, i) => {
                  const rainbow = (h.hero.cost ?? 1) >= 6;
                  const color = costColor(h.hero.cost);
                  const synergyNames = (h.hero.synergies ?? [])
                    .map((s) => (typeof s === "string" ? null : s.name))
                    .filter(Boolean)
                    .slice(0, 2);
                  const equipment = h.equipment ?? [];
                  const emptySlots = Math.max(0, Math.min(3, equipment.length === 0 ? 0 : 3 - equipment.length));
                  return (
                    <div key={`${h.hero._id}-${i}`} className="flex items-start gap-3">
                      {/* Hero icon — circle with cost-colored ring */}
                      <span
                        className="relative shrink-0"
                        title={`Cost ${h.hero.cost}`}
                      >
                        {rainbow ? (
                          <span
                            className="grid h-12 w-12 place-items-center rounded-full p-[2px]"
                            style={{ backgroundImage: RAINBOW_GRADIENT }}
                          >
                            <span className="grid h-full w-full place-items-center overflow-hidden rounded-full bg-surface text-lg font-black">
                              {h.hero.image ? (
                                <img src={h.hero.image} alt="" loading="lazy" className="h-full w-full object-cover" />
                              ) : (
                                h.hero.name.slice(0, 1)
                              )}
                            </span>
                          </span>
                        ) : (
                          <span
                            className="grid h-12 w-12 place-items-center overflow-hidden rounded-full bg-surface text-lg font-black"
                            style={{ boxShadow: `0 0 0 2px ${color}` }}
                          >
                            {h.hero.image ? (
                              <img src={h.hero.image} alt="" loading="lazy" className="h-full w-full object-cover" />
                            ) : (
                              h.hero.name.slice(0, 1)
                            )}
                          </span>
                        )}
                        <span
                          className="absolute -bottom-1 left-1/2 z-10 -translate-x-1/2 rounded px-1 text-[9px] font-black leading-tight text-background"
                          style={{
                            backgroundColor: rainbow ? "#e879f9" : color,
                          }}
                        >
                          {h.hero.cost}
                        </span>
                      </span>

                      <div className="min-w-0 flex-1 pt-0.5 text-sm">
                        <p className="truncate font-medium">{h.hero.name}</p>
                        {synergyNames.length > 0 && (
                          <p className="truncate text-xs capitalize text-muted">
                            {synergyNames.join(" / ")}
                          </p>
                        )}

                        {/* Item recommendation — up to three item circles */}
                        {(equipment.length > 0 || emptySlots > 0) && (
                          <div className="mt-1.5 flex items-center gap-1.5">
                            {equipment.slice(0, 3).map((eq) => (
                              <span
                                key={eq._id}
                                title={eq.name}
                                className="grid h-5 w-5 shrink-0 place-items-center overflow-hidden rounded-full border border-border bg-elevated"
                              >
                                {eq.image ? (
                                  <img src={eq.image} alt={eq.name} loading="lazy" className="h-full w-full object-cover" />
                                ) : (
                                  <span className="text-[9px] font-bold text-muted">{eq.name.slice(0, 1)}</span>
                                )}
                              </span>
                            ))}
                            {Array.from({ length: emptySlots }).map((_, idx) => (
                              <span
                                key={`empty-${idx}`}
                                className="h-5 w-5 shrink-0 rounded-full border border-dashed border-border/70"
                              />
                            ))}
                          </div>
                        )}

                        {h.note && <p className="mt-1 text-xs italic text-muted">{h.note}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Strategy */}
          {filledStrategy.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Strategy</CardTitle>
              </CardHeader>
              <CardContent>
                {filledStrategy.length > 3 ? (
                  <Tabs defaultValue={filledStrategy[0][0]}>
                    <TabsList className="w-full justify-start overflow-x-auto">
                      {filledStrategy.map(([key, label]) => (
                        <TabsTrigger key={key} value={key}>
                          {label}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    {filledStrategy.map(([key]) => (
                      <TabsContent key={key} value={key}>
                        <Markdown content={lineup.strategy[key] ?? ""} />
                      </TabsContent>
                    ))}
                  </Tabs>
                ) : (
                  <div className="space-y-5">
                    {filledStrategy.map(([key, label]) => (
                      <div key={key}>
                        <h3 className="mb-1 font-semibold">{label}</h3>
                        <Markdown content={lineup.strategy[key] ?? ""} />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Comments */}
          {lineup && (
            <CommentThread
              lineupId={lineup._id}
              comments={commentsQuery.data?.comments ?? []}
              pagination={commentsQuery.data?.pagination}
              onPageChange={setCommentPage}
            />
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-5">
          {/* Commander */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-accent" /> Commander
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {lineup.commander ? (
                <div className="flex items-center gap-3">
                  {lineup.commander.image ? (
                    <img
                      src={lineup.commander.image}
                      alt={lineup.commander.name}
                      loading="lazy"
                      className="h-14 w-14 rounded-xl object-cover ring-2 ring-primary/40"
                    />
                  ) : (
                    <span className="grid h-14 w-14 place-items-center rounded-xl bg-primary/15 text-xl font-black text-primary">
                      {lineup.commander.name.slice(0, 1)}
                    </span>
                  )}
                  <div>
                    <p className="font-semibold">{lineup.commander.name}</p>
                    <p className="text-xs text-muted">Commander</p>
                  </div>
                </div>
              ) : (lineup.recommendedCommanders?.length ?? 0) > 0 ? (
                <>
                  <p className="text-xs text-muted">
                    Any of these commanders works — listed by priority.
                  </p>
                  <ul className="space-y-2">
                    {lineup.recommendedCommanders!.map((c, i) => (
                      <li key={c._id} className="flex items-center gap-3">
                        <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/15 text-[11px] font-bold text-primary">
                          {i + 1}
                        </span>
                        {c.image ? (
                          <img
                            src={c.image}
                            alt={c.name}
                            loading="lazy"
                            className="h-10 w-10 rounded-lg object-cover ring-1 ring-border"
                          />
                        ) : (
                          <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/15 font-black text-primary">
                            {c.name.slice(0, 1)}
                          </span>
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold leading-tight">
                            {c.name}
                          </p>
                          {i === 0 && (
                            <p className="text-xs text-gold">Top pick</p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="text-sm text-muted">
                  No specific commander required.
                </p>
              )}
              {lineup.commanderSkill?.name && (
                <div className="rounded-lg border border-border bg-surface p-3">
                  <p className="flex items-center gap-1.5 text-sm font-medium">
                    <Zap className="h-3.5 w-3.5 text-gold" />
                    {lineup.commanderSkill.name}
                  </p>
                  {lineup.commanderSkill.description && (
                    <p className="mt-1 text-xs text-muted">
                      {lineup.commanderSkill.description}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* GoGo cards */}
          {(lineup.gogoCards?.length ?? 0) > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-gold" /> GoGo cards
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-2">
                  {lineup.gogoCards!.map((card, i) => (
                    <li
                      key={card._id}
                      className="flex items-start gap-3 rounded-lg border border-border bg-surface p-3"
                    >
                      <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/15 text-[11px] font-bold text-primary">
                        {i + 1}
                      </span>
                      {card.image ? (
                        <img
                          src={card.image}
                          alt=""
                          loading="lazy"
                          className="h-10 w-14 shrink-0 rounded-md object-cover"
                        />
                      ) : null}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {card.name}
                        </p>
                        {card.description && (
                          <p className="mt-0.5 line-clamp-2 text-xs text-muted">
                            {card.description}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          )}

          {/* Synergies */}
          {lineup.synergies.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Synergies</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {lineup.synergies.map((s) => {
                  const levels = [...(s.synergy.activationLevels ?? [])].sort((a, b) => a.count - b.count);
                  const activeLevel = [...levels].reverse().find((l) => l.count <= s.count);
                  const nextLevel = levels.find((l) => l.count > s.count);
                  const maxCount = levels.length > 0 ? levels[levels.length - 1].count : s.count;
                  const color = s.synergy.color ?? "#8b5cf6";
                  return (
                    <div
                      key={s.synergy._id}
                      className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3"
                    >
                      {/* Column 1 — synergy symbol */}
                      {s.synergy.image ? (
                        <img
                          src={s.synergy.image}
                          alt=""
                          loading="lazy"
                          className="h-10 w-10 shrink-0 rounded-full object-cover"
                          style={{ boxShadow: `0 0 0 2px ${color}` }}
                        />
                      ) : (
                        <span
                          className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-black"
                          style={{
                            backgroundColor: `${color}22`,
                            color,
                            boxShadow: `0 0 0 2px ${color}`,
                          }}
                        >
                          {s.synergy.name.slice(0, 1)}
                        </span>
                      )}

                      {/* Column 2 — name, current/max, effects */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="truncate text-sm font-semibold">{s.synergy.name}</p>
                          <span className="shrink-0 text-sm font-black" style={{ color }}>
                            {s.count}/{maxCount}
                          </span>
                        </div>
                        {activeLevel && (
                          <p className="mt-0.5 truncate text-xs text-muted">✓ {activeLevel.effect}</p>
                        )}
                        {nextLevel && (
                          <p className="truncate text-xs text-muted/70">
                            Next at {nextLevel.count}: {nextLevel.effect}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Rating */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-4 w-4 text-gold" /> Ratings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-3xl font-black">
                    {lineup.averageRating > 0 ? lineup.averageRating.toFixed(1) : "—"}
                  </p>
                  <StarRating value={Math.round(lineup.averageRating)} />
                  <p className="mt-1 text-xs text-muted">
                    {lineup.ratingsCount} rating{lineup.ratingsCount === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="flex-1 space-y-1">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = Number(distribution[String(star)] ?? distribution[star] ?? 0);
                    return (
                      <div key={star} className="flex items-center gap-2 text-xs text-muted">
                        <span className="w-3 text-right">{star}</span>
                        <Star className="h-3 w-3 fill-gold text-gold" />
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-elevated">
                          <div
                            className="h-full rounded-full bg-gold"
                            style={{ width: `${(count / maxDist) * 100}%` }}
                          />
                        </div>
                        <span className="w-6">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <Separator />
              <div>
                <p className="mb-2 text-sm font-medium">
                  {detail!.viewerRating
                    ? `Your rating: ${detail!.viewerRating} ★`
                    : "Rate this lineup"}
                </p>
                <StarRating
                  value={detail!.viewerRating ?? 0}
                  size="lg"
                  interactive
                  onChange={(v) => rateMutation.mutate(v)}
                />
                {rateMutation.isPending && (
                  <Loader2 className="ml-2 inline h-4 w-4 animate-spin text-muted" />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Equipment summary */}
          {lineup.heroes.some((h) => h.equipment.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle>Equipment plan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {lineup.heroes
                  .filter((h) => h.equipment.length > 0)
                  .map((h) => (
                    <div key={h.hero._id + h.position.col} className="text-sm">
                      <span className="font-medium">{h.hero.name}</span>
                      <span className="text-muted"> → </span>
                      {h.equipment.map((eq, i) => (
                        <span key={eq._id}>
                          {i > 0 && ", "}
                          <span
                            className={cn(
                              "font-medium",
                              eq.statType === "attack" && "text-rose-300",
                              eq.statType === "magic" && "text-foreground",
                              eq.statType === "defense" && "text-sky-300",
                              eq.statType === "utility" && "text-emerald-300",
                            )}
                          >
                            {eq.name}
                          </span>
                        </span>
                      ))}
                    </div>
                  ))}
              </CardContent>
            </Card>
          )}

          {/* Meta */}
          <Card>
            <CardContent className="space-y-2 p-5 text-xs text-muted">
              <p className="flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5" /> {lineup.commentsCount} comments
              </p>
              <p>Published {timeAgo(lineup.createdAt)}</p>
              <p>Last updated {timeAgo(lineup.updatedAt)}</p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </>
  );
}

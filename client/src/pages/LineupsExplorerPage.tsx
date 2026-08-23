import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { SlidersHorizontal, X } from "lucide-react";
import { lineupsApi } from "../api/endpoints";
import { useGameData } from "../hooks/useGameData";
import type { Lineup } from "../types";
import { LineupCard } from "../components/LineupCard";
import { LineupGridSkeleton } from "../components/LineupGridSkeleton";
import { EmptyState } from "../components/EmptyState";
import { ErrorState } from "../components/ErrorState";
import { Seo } from "../components/Seo";
import { Button } from "../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

const SORTS = [
  { value: "trending", label: "Trending" },
  { value: "likes", label: "Most liked" },
  { value: "views", label: "Most viewed" },
  { value: "rating", label: "Highest rated" },
  { value: "newest", label: "Newest" },
  { value: "updated", label: "Recently updated" },
];

const DIFFICULTIES = ["beginner", "intermediate", "advanced"];

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</p>
      {children}
    </div>
  );
}

export default function LineupsExplorerPage() {
  const [params, setParams] = useSearchParams();
  const { data: gameData } = useGameData();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const query = useMemo(
    () => ({
      q: params.get("q") ?? "",
      season: params.get("season") ?? "",
      gameMode: params.get("gameMode") ?? "",
      commander: params.get("commander") ?? "",
      synergy: params.get("synergy") ?? "",
      hero: params.get("hero") ?? "",
      tag: params.get("tag") ?? "",
      difficulty: params.get("difficulty") ?? "",
      sort: params.get("sort") ?? "trending",
      page: Number(params.get("page") ?? 1),
    }),
    [params],
  );

  const setParam = (key: string, value: string) => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value) next.set(key, value);
        else next.delete(key);
        if (key !== "page") next.delete("page");
        return next;
      },
      { replace: false },
    );
  };

  const listQuery = useQuery({
    queryKey: ["lineups", "explorer", query],
    queryFn: async () => {
      const res = await lineupsApi.list({ ...query, limit: 12 });
      return res.data.data;
    },
    placeholderData: keepPreviousData,
  });

  const activeFilterCount = [
    "q",
    "season",
    "gameMode",
    "commander",
    "synergy",
    "hero",
    "tag",
    "difficulty",
  ].filter((k) => params.get(k)).length;

  const filtersPanel = (
    <div className="space-y-5">
      <FilterGroup label="Sort by">
        <Select value={query.sort} onValueChange={(v) => setParam("sort", v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORTS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterGroup>

      <FilterGroup label="Season">
        <Select
          value={query.season || "all"}
          onValueChange={(v) => setParam("season", v === "all" ? "" : v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="All seasons" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All seasons</SelectItem>
            {gameData?.seasons.map((s) => (
              <SelectItem key={s._id} value={s.slug}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterGroup>

      <FilterGroup label="Game mode">
        <Select
          value={query.gameMode || "all"}
          onValueChange={(v) => setParam("gameMode", v === "all" ? "" : v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="All modes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All modes</SelectItem>
            {gameData?.gameModes.map((m) => (
              <SelectItem key={m._id} value={m.slug}>
                {m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterGroup>

      <FilterGroup label="Commander">
        <Select
          value={query.commander || "all"}
          onValueChange={(v) => setParam("commander", v === "all" ? "" : v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Any commander" />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            <SelectItem value="all">Any commander</SelectItem>
            {gameData?.commanders.map((c) => (
              <SelectItem key={c._id} value={c.slug ?? c._id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterGroup>

      <FilterGroup label="Synergy">
        <Select
          value={query.synergy || "all"}
          onValueChange={(v) => setParam("synergy", v === "all" ? "" : v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Any synergy" />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            <SelectItem value="all">Any synergy</SelectItem>
            {gameData?.synergies.map((s) => (
              <SelectItem key={s._id} value={s.slug}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterGroup>

      <FilterGroup label="Hero">
        <Select
          value={query.hero || "all"}
          onValueChange={(v) => setParam("hero", v === "all" ? "" : v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Any hero" />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            <SelectItem value="all">Any hero</SelectItem>
            {gameData?.heroes.map((h) => (
              <SelectItem key={h._id} value={h.slug}>
                {h.name} ({h.cost})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterGroup>

      <FilterGroup label="Difficulty">
        <div className="flex flex-wrap gap-1.5">
          <Button
            size="sm"
            variant={!query.difficulty ? "default" : "secondary"}
            onClick={() => setParam("difficulty", "")}
          >
            Any
          </Button>
          {DIFFICULTIES.map((d) => (
            <Button
              key={d}
              size="sm"
              variant={query.difficulty === d ? "default" : "secondary"}
              onClick={() => setParam("difficulty", d)}
              className="capitalize"
            >
              {d}
            </Button>
          ))}
        </div>
      </FilterGroup>

      {activeFilterCount > 0 && (
        <Button variant="ghost" size="sm" onClick={() => setParams({})} className="w-full">
          <X /> Clear all filters
        </Button>
      )}
    </div>
  );

  const pagination = listQuery.data?.pagination;

  return (
    <>
      <Seo title="Browse lineups" description="Browse community Magic Chess: Go Go lineups with filters for season, commander, synergy and more." pathname="/lineups" />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Lineup Explorer</h1>
          <p className="text-sm text-muted">
            {pagination
              ? `${pagination.total} lineup${pagination.total === 1 ? "" : "s"} found`
              : "Loading…"}
          </p>
        </div>
        <Button
          variant="secondary"
          className="lg:hidden"
          onClick={() => setMobileFiltersOpen((v) => !v)}
        >
          <SlidersHorizontal /> Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-xl border border-border bg-card p-4">
            {filtersPanel}
          </div>
        </aside>

        {mobileFiltersOpen && (
          <div className="rounded-xl border border-border bg-card p-4 lg:hidden animate-fade-in">
            {filtersPanel}
          </div>
        )}

        <div className="min-w-0">
          {listQuery.isLoading ? (
            <LineupGridSkeleton count={9} />
          ) : listQuery.isError ? (
            <ErrorState onRetry={() => void listQuery.refetch()} />
          ) : !listQuery.data || listQuery.data.lineups.length === 0 ? (
            <EmptyState
              icon="search"
              title="No lineups found"
              description="Try adjusting your filters or search terms — or be the first to publish a lineup like this."
              action={{ label: "Create a lineup", to: "/create-lineup" }}
            />
          ) : (
            <>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {listQuery.data.lineups.map((lineup: Lineup) => (
                  <LineupCard key={lineup._id} lineup={lineup} />
                ))}
              </div>

              {pagination && pagination.totalPages > 1 && (
                <nav className="mt-8 flex items-center justify-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={query.page <= 1}
                    onClick={() => setParam("page", String(query.page - 1))}
                  >
                    Previous
                  </Button>
                  <span className="px-3 text-sm text-muted">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={query.page >= pagination.totalPages}
                    onClick={() => setParam("page", String(query.page + 1))}
                  >
                    Next
                  </Button>
                </nav>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

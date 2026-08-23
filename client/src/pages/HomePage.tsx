import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Flame, Sparkles, TrendingUp, Trophy, Clock, Users } from "lucide-react";
import { lineupsApi } from "../api/endpoints";
import { useGameData } from "../hooks/useGameData";
import type { Lineup, UserPublic } from "../types";
import { LineupCard } from "../components/LineupCard";
import { LineupGridSkeleton } from "../components/LineupGridSkeleton";
import { EmptyState } from "../components/EmptyState";
import { ErrorState } from "../components/ErrorState";
import { Seo } from "../components/Seo";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";

function useLineupSection(sort: string, limit = 4) {
  return useQuery({
    queryKey: ["lineups", "home", sort],
    queryFn: async () => {
      const res = await lineupsApi.list({ sort, limit });
      return res.data.data.lineups;
    },
    staleTime: 60 * 1000,
  });
}

function SectionHeader({
  icon,
  title,
  linkTo,
}: {
  icon: React.ReactNode;
  title: string;
  linkTo: string;
}) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight">
        {icon}
        {title}
      </h2>
      <Link
        to={linkTo}
        className="flex items-center gap-1 text-sm text-muted transition-colors hover:text-accent"
      >
        View all <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

function Section({
  icon,
  title,
  linkTo,
  query,
}: {
  icon: React.ReactNode;
  title: string;
  linkTo: string;
  query: { data?: Lineup[]; isLoading: boolean; isError: boolean; refetch: () => void };
}) {
  return (
    <section className="mt-12">
      <SectionHeader icon={icon} title={title} linkTo={linkTo} />
      {query.isLoading ? (
        <LineupGridSkeleton count={4} />
      ) : query.isError ? (
        <ErrorState onRetry={query.refetch} />
      ) : !query.data || query.data.length === 0 ? (
        <EmptyState
          title="No lineups yet"
          description="Be the first player to upload a lineup for this season."
          action={{ label: "Create a lineup", to: "/create-lineup" }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {query.data.map((lineup) => (
            <LineupCard key={lineup._id} lineup={lineup} />
          ))}
        </div>
      )}
    </section>
  );
}

export default function HomePage() {
  const trending = useLineupSection("trending");
  const newest = useLineupSection("newest");
  const popular = useLineupSection("views");
  const topRated = useLineupSection("rating");

  const featured = useQuery({
    queryKey: ["lineups", "featured"],
    queryFn: async () => {
      const res = await lineupsApi.featured();
      return res.data.data.lineups;
    },
    staleTime: 60 * 1000,
  });

  const { data: gameData } = useGameData();
  const activeSeason = gameData?.seasons?.[0];

  const creators = new Map<string, UserPublic>();
  for (const l of [
    ...(trending.data ?? []),
    ...(popular.data ?? []),
    ...(newest.data ?? []),
  ]) {
    if (!creators.has(l.author.username)) {
      creators.set(l.author.username, l.author);
    }
  }
  const popularCreators = [...creators.values()].slice(0, 6);

  return (
    <>
      <Seo
        title="GoGoTactics"
        description="Discover, share and rate community lineups for Magic Chess: Go Go. Board positions, commanders, synergies, equipment and strategy."
        pathname="/"
      />

      {/* Hero */}
      <section className="relative overflow-hidden rounded-none border-[3px] border-foreground bg-card px-6 py-14 text-center shadow-comic-lg sm:px-12 sm:py-20">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(rgba(13,13,13,0.07) 1.5px, transparent 1.5px)",
            backgroundSize: "12px 12px",
          }}
        />
        <div className="relative">
          <Badge variant="cyan" className="mb-4 -rotate-2">
            <Sparkles className="h-3 w-3" />
            {activeSeason ? `Now browsing ${activeSeason.name}` : "Community-driven lineups"}
          </Badge>
          <h1 className="mx-auto max-w-3xl font-display text-4xl uppercase leading-tight tracking-wide sm:text-6xl">
            Find your next <span className="text-gradient">winning lineup</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm font-medium text-muted sm:text-base">
            Community-built comp guides for Magic Chess: Go Go — board positions,
            commander skills, synergies, itemization and full game plans.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/lineups"
              className="inline-flex h-11 items-center gap-2 rounded-none border-2 border-foreground bg-primary px-6 font-bold uppercase tracking-wide shadow-comic transition-all hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-comic-lg active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              Browse lineups <ArrowRight className="h-4 w-4" strokeWidth={3} />
            </Link>
            <Link
              to="/create-lineup"
              className="inline-flex h-11 items-center gap-2 rounded-none border-2 border-foreground bg-elevated px-6 font-bold uppercase tracking-wide shadow-comic-sm transition-all hover:bg-card hover:shadow-comic active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              Share your build
            </Link>
          </div>
        </div>
      </section>

      {/* Featured */}
      {featured.data && featured.data.length > 0 && (
        <section className="mt-12">
          <SectionHeader
            icon={<Trophy className="h-5 w-5 text-gold" />}
            title="Featured lineups"
            linkTo="/lineups?sort=likes"
          />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.data.slice(0, 6).map((lineup) => (
              <LineupCard key={lineup._id} lineup={lineup} />
            ))}
          </div>
        </section>
      )}

      <Section
        icon={<Flame className="h-5 w-5 text-orange-400" />}
        title="Trending now"
        linkTo="/lineups?sort=trending"
        query={trending}
      />

      {/* Popular creators */}
      {popularCreators.length > 0 && (
        <section className="mt-12">
          <SectionHeader
            icon={<Users className="h-5 w-5 text-accent" />}
            title="Popular creators"
            linkTo="/lineups?sort=newest"
          />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {popularCreators.map((creator) => (
              <Link
                key={creator._id}
                to={`/users/${creator.username}`}
                className="card-hover flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 text-center"
              >
                <Avatar className="h-12 w-12">
                  {creator.avatar?.url ? (
                    <AvatarImage src={creator.avatar.url} alt={creator.username} />
                  ) : null}
                  <AvatarFallback>{creator.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="truncate text-sm font-medium">@{creator.username}</span>
                <span className="text-xs text-muted">
                  {creator.lineupsCount ?? 0} lineup{(creator.lineupsCount ?? 0) === 1 ? "" : "s"}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <Section
        icon={<Clock className="h-5 w-5 text-cyan-300" />}
        title="Fresh uploads"
        linkTo="/lineups?sort=newest"
        query={newest}
      />

      <Section
        icon={<TrendingUp className="h-5 w-5 text-foreground" />}
        title="Most popular"
        linkTo="/lineups?sort=views"
        query={popular}
      />

      <Section
        icon={<Trophy className="h-5 w-5 text-gold" />}
        title="Highest rated"
        linkTo="/lineups?sort=rating"
        query={topRated}
      />
    </>
  );
}

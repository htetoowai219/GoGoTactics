import { useQuery } from "@tanstack/react-query";
import { usersApi } from "../api/endpoints";
import type { Lineup } from "../types";
import { LineupCard } from "../components/LineupCard";
import { LineupGridSkeleton } from "../components/LineupGridSkeleton";
import { EmptyState } from "../components/EmptyState";
import { ErrorState } from "../components/ErrorState";
import { Seo } from "../components/Seo";

export default function SavedPage() {
  const query = useQuery({
    queryKey: ["saved-lineups"],
    queryFn: async () => {
      const res = await usersApi.saved();
      return res.data.data.lineups;
    },
  });

  return (
    <>
      <Seo title="Saved lineups" description="Your bookmarked Magic Chess lineups" pathname="/saved" noIndex />
      <h1 className="mb-1 text-2xl font-bold tracking-tight">Saved lineups</h1>
      <p className="mb-6 text-sm text-muted">Your personal collection of bookmarked builds.</p>

      {query.isLoading ? (
        <LineupGridSkeleton count={4} />
      ) : query.isError ? (
        <ErrorState onRetry={() => void query.refetch()} />
      ) : !query.data || query.data.length === 0 ? (
        <EmptyState
          title="No saved lineups yet"
          description="Bookmark lineups with the save icon to build your collection."
          action={{ label: "Browse lineups", to: "/lineups" }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {query.data.map((lineup: Lineup) => (
            <LineupCard key={lineup._id} lineup={lineup} />
          ))}
        </div>
      )}
    </>
  );
}

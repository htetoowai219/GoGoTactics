import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { lineupsApi } from "../api/endpoints";
import {
  lineupToEditorState,
  type EditorState,
} from "../features/lineups/editor/editorState";
import { LineupBuilder } from "../features/lineups/editor/LineupBuilder";
import { Seo } from "../components/Seo";
import { ErrorState } from "../components/ErrorState";
import { Skeleton } from "../components/ui/skeleton";

async function fetchLineup(id: string) {
  const res = await lineupsApi.byIdForEdit(id);
  return res.data.data.lineup;
}

export default function CreateLineupPage() {
  return (
    <>
      <Seo
        title="Create a lineup"
        description="Build your Magic Chess: Go Go lineup on an interactive board."
        pathname="/create-lineup"
        noIndex
      />
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Build your lineup</h1>
        <p className="text-sm text-muted">
          Place heroes, attach items, pick commanders and prioritize gogo cards —
          then describe your strategy.
        </p>
      </div>
      <LineupBuilder />
    </>
  );
}

export function EditLineupPage() {
  const { id = "" } = useParams();
  const [initialState, setInitialState] = useState<EditorState | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["lineup-edit", id],
    queryFn: () => fetchLineup(id),
    retry: false,
  });

  useEffect(() => {
    if (query.data && !initialState) {
      setInitialState(lineupToEditorState(query.data));
    }
    if (query.isError) {
      setLoadError("Could not load this lineup for editing.");
    }
  }, [query.data, query.isError, initialState]);

  if (query.isLoading || (!initialState && !loadError)) {
    return (
      <div className="mx-auto max-w-5xl space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (loadError || !initialState) {
    return (
      <ErrorState
        message={loadError ?? undefined}
        onRetry={() => void query.refetch()}
      />
    );
  }

  return (
    <>
      <Seo title="Edit lineup" pathname={`/lineups/${id}/edit`} noIndex />
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Edit lineup</h1>
        <p className="text-sm text-muted">
          Update anything — changes go live immediately on save.
        </p>
      </div>
      <LineupBuilder key={id} lineupId={id} initialState={initialState} />
    </>
  );
}

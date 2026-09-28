import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Eye, Heart, MessageSquare, Bookmark, Star } from "lucide-react";
import { toast } from "sonner";
import { lineupsApi, getApiErrorMessage } from "../api/endpoints";
import { useAuthStore } from "../stores/authStore";
import type { Lineup } from "../types";
import { cn, formatCount, timeAgo } from "../lib/utils";

interface LineupCardProps {
  lineup: Lineup;
  onToggleSave?: (lineup: Lineup) => void;
}

export function LineupCard({ lineup, onToggleSave }: LineupCardProps) {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const mainSynergy = lineup.synergies?.[0]?.synergy;

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("auth");
      if (lineup.savedByViewer) return lineupsApi.unsave(lineup._id);
      return lineupsApi.save(lineup._id);
    },
    onSuccess: () => {
      const saved = !lineup.savedByViewer;
      toast.success(saved ? "Saved to your collection" : "Removed from saved");
      onToggleSave?.({
        ...lineup,
        savedByViewer: saved,
        savesCount: lineup.savesCount + (saved ? 1 : -1),
      });
      void queryClient.invalidateQueries({ queryKey: ["lineups"] });
      void queryClient.invalidateQueries({ queryKey: ["saved-lineups"] });
    },
    onError: (err) => {
      if ((err as Error).message === "auth") {
        toast.error("Log in to save lineups");
        return;
      }
      toast.error(getApiErrorMessage(err, "Could not update save"));
    },
  });

  return (
    <article className="card-hover group relative flex flex-col overflow-hidden rounded-none border-[3px] border-foreground bg-card shadow-comic">
      <Link
        to={`/lineups/${lineup.slug}`}
        className="relative block aspect-[16/9] overflow-hidden border-b-[3px] border-foreground bg-elevated"
      >
        {lineup.thumbnail?.url ? (
          <img
            src={lineup.thumbnail.url}
            alt={lineup.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center gap-4 p-4">
            {lineup.commander?.image ? (
              <img
                src={lineup.commander.image}
                alt=""
                loading="lazy"
                className="h-20 w-20 rounded-full border-[3px] border-foreground object-cover"
              />
            ) : (
              <span className="grid h-20 w-20 place-items-center rounded-full border-[3px] border-foreground bg-primary/60 text-3xl font-black text-foreground">
                {lineup.commander?.name?.slice(0, 1) ?? "?"}
              </span>
            )}
            <div className="text-left">
              <p className="text-xs uppercase tracking-widest text-muted">Commander</p>
              <p className="font-bold text-lg">{lineup.commander?.name}</p>
              {mainSynergy && (
                <span
                  className="mt-1 inline-block rounded-none border-2 border-foreground px-2 py-0.5 text-xs font-bold uppercase tracking-wide"
                  style={{ backgroundColor: mainSynergy.color ?? "#ffe600", color: "#0d0d0d" }}
                >
                  {mainSynergy.name}
                  {lineup.synergies[0].count > 1 ? ` ×${lineup.synergies[0].count}` : ""}
                </span>
              )}
            </div>
          </div>
        )}
        <span className="absolute left-2 top-2 rounded-none border-2 border-foreground bg-card px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide">
          {lineup.season?.name}
        </span>
        {lineup.featured && (
          <span className="absolute right-2 top-2 -rotate-2 rounded-none border-2 border-foreground bg-gold px-2 py-0.5 font-display text-xs uppercase tracking-wide text-bright-ink">
            ★ Featured
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <Link to={`/lineups/${lineup.slug}`} className="mb-1.5">
          <h3 className="font-semibold leading-snug line-clamp-1 group-hover:text-foreground transition-colors">
            {lineup.title}
          </h3>
        </Link>

        <div className="mb-3 flex items-center gap-2 text-sm text-muted">
          <Link
            to={`/users/${lineup.author.username}`}
            className="hover:text-accent truncate"
            onClick={(e) => e.stopPropagation()}
          >
            @{lineup.author.username}
          </Link>
          <span aria-hidden>·</span>
          <span className="capitalize">{lineup.difficulty}</span>
          <span aria-hidden>·</span>
          <span>{timeAgo(lineup.createdAt)}</span>
        </div>

        {lineup.tags.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {lineup.tags.slice(0, 3).map((tag) => (
              <Link
                key={tag}
                to={`/lineups?tag=${tag}`}
                className="rounded-md border border-border bg-surface px-1.5 py-0.5 text-[11px] text-muted hover:text-accent hover:border-accent/40"
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between border-t border-border pt-3">
          <div className="flex items-center gap-1 text-gold">
            <Star className="h-3.5 w-3.5 fill-gold" />
            <span className="text-xs font-semibold">
              {lineup.averageRating > 0 ? lineup.averageRating.toFixed(1) : "—"}
            </span>
            <span className="text-[11px] text-muted">
              ({formatCount(lineup.ratingsCount)})
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-muted">
            <span className="flex items-center gap-1" title="Likes">
              <Heart className="h-3.5 w-3.5" /> {formatCount(lineup.likesCount)}
            </span>
            <span className="flex items-center gap-1" title="Comments">
              <MessageSquare className="h-3.5 w-3.5" /> {formatCount(lineup.commentsCount)}
            </span>
            <span className="flex items-center gap-1" title="Views">
              <Eye className="h-3.5 w-3.5" /> {formatCount(lineup.viewsCount)}
            </span>
            <button
              onClick={(e) => {
                e.preventDefault();
                saveMutation.mutate();
              }}
              disabled={saveMutation.isPending}
              className={cn(
                "cursor-pointer transition-colors",
                lineup.savedByViewer
                  ? "text-accent hover:text-cyan-200"
                  : "text-muted hover:text-foreground",
              )}
              title={lineup.savedByViewer ? "Remove from saved" : "Save lineup"}
            >
              <Bookmark
                className={cn("h-4 w-4", lineup.savedByViewer && "fill-accent")}
              />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

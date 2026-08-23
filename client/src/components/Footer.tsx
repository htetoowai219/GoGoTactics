import { Link } from "react-router-dom";
import { Swords } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t-[3px] border-foreground mt-16 bg-elevated">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 text-muted">
            <span className="grid h-8 w-8 place-items-center rounded-none border-2 border-foreground bg-primary shadow-comic-sm rotate-3">
              <Swords className="h-4 w-4" strokeWidth={2.5} />
            </span>
            <div className="text-sm font-medium">
              <span className="font-display text-base uppercase tracking-wide text-foreground">
                GoGoTactics
              </span>
              <span> — community lineups for Magic Chess: Go Go</span>
            </div>
          </div>
          <nav className="flex items-center gap-5 text-sm font-bold uppercase tracking-wide text-muted">
            <Link to="/lineups" className="hover:text-foreground hover:underline decoration-[3px] decoration-accent underline-offset-4">
              Browse lineups
            </Link>
            <Link to="/create-lineup" className="hover:text-foreground hover:underline decoration-[3px] decoration-danger underline-offset-4">
              Create a lineup
            </Link>
          </nav>
        </div>
        <p className="mt-6 text-xs text-muted text-center font-medium">
          Fan-made community project. Game data on this site is community-contributed
          and sample data is clearly marked. Not affiliated with the game's publisher.
        </p>
      </div>
    </footer>
  );
}

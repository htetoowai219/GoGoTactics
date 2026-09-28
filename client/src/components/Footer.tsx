import { Link } from "react-router-dom";
import { BookOpen, Swords } from "lucide-react";
import { ThemeSwitcher } from "./ThemeSwitcher";

export function Footer() {
  return (
    <footer className="border-t-[3px] border-foreground mt-16 bg-elevated">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 text-muted">
            <span className="grid h-8 w-8 place-items-center rounded-none border-2 border-foreground bg-primary text-bright-ink shadow-comic-sm rotate-3">
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
            <Link to="/how-to-use" className="hover:text-foreground hover:underline decoration-[3px] decoration-gold underline-offset-4">
              How to use
            </Link>
          </nav>
        </div>

        <div className="mt-8 flex flex-col items-center gap-4 border-t-2 border-border pt-6 sm:flex-row sm:justify-between">
          <div className="flex flex-col items-center gap-2 sm:items-start">
            <span className="text-xs font-bold uppercase tracking-wide text-foreground">
              Theme
            </span>
            <ThemeSwitcher />
          </div>
          <p className="max-w-xl text-center text-xs text-muted font-medium sm:text-right">
            Fan-made community project, vibe coded as a non-commercial hobby. Game
            data on this site is community-contributed and sample data is clearly
            marked. Not affiliated with the game's publisher.
          </p>
        </div>

        <div className="mt-6 flex flex-col items-center justify-center gap-2 text-center sm:flex-row sm:gap-5">
          <Link
            to="/how-to-use"
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-foreground hover:underline decoration-[3px] decoration-gold underline-offset-4"
          >
            <BookOpen className="h-3.5 w-3.5" strokeWidth={2.5} />
            How to use GoGoTactics
          </Link>
          <span className="hidden text-xs text-muted sm:inline">·</span>
          <span className="text-xs text-muted font-medium">
            Sample data only — no game assets are used or distributed.
          </span>
        </div>
      </div>
    </footer>
  );
}

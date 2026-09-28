import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { BookOpen, Compass, MessageSquare, PenLine, Sparkles } from "lucide-react";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

export const WELCOME_STORAGE_KEY = "gogotactics-welcome-dismissed";
const HOME_PATH = "/";
const MANUAL_PATH = "/how-to-use";

function wasDismissed(): boolean {
  try {
    return window.localStorage.getItem(WELCOME_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function rememberDismissed(): void {
  try {
    window.localStorage.setItem(WELCOME_STORAGE_KEY, "true");
  } catch {
    // Storage unavailable (private mode) — the dialog simply returns next visit.
  }
}

const HIGHLIGHTS = [
  {
    icon: Compass,
    title: "Browse comps",
    body: "Filter by season, mode, synergy or hero — sort by trending or top rated.",
  },
  {
    icon: PenLine,
    title: "Build yours",
    body: "A guided editor: commander, board, equipment and a full written game plan.",
  },
  {
    icon: MessageSquare,
    title: "Rate & discuss",
    body: "Star, comment, save and follow the creators you rate.",
  },
];

export function WelcomeDialog() {
  const [open, setOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    // First-visit intro only, and only on the homepage.
    if (pathname !== HOME_PATH) {
      setOpen(false);
      return;
    }
    if (!wasDismissed()) setOpen(true);
  }, [pathname]);

  const remember = () => {
    if (dontShowAgain) rememberDismissed();
  };

  const close = () => {
    remember();
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) close();
      }}
    >
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <span className="mb-2 inline-flex w-fit items-center gap-1.5 rounded-none border-2 border-foreground bg-primary px-2 py-0.5 text-[11px] font-bold uppercase tracking-widest text-bright-ink shadow-comic-sm -rotate-2">
            <Sparkles className="h-3 w-3" strokeWidth={3} /> Welcome
          </span>
          <DialogTitle>Welcome to GoGoTactics</DialogTitle>
          <DialogDescription>
            A community notebook for <em>Magic Chess: Go Go</em> lineups — every
            comp here was written by another player. Three things worth knowing
            before you dive in:
          </DialogDescription>
        </DialogHeader>

        <ul className="space-y-3">
          {HIGHLIGHTS.map(({ icon: Icon, title, body }) => (
            <li
              key={title}
              className="flex items-start gap-3 rounded-none border-2 border-border bg-elevated px-3 py-2.5"
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-none border-2 border-foreground bg-accent text-bright-ink">
                <Icon className="h-4 w-4" strokeWidth={2.5} />
              </span>
              <div>
                <p className="text-sm font-bold uppercase tracking-wide">
                  {title}
                </p>
                <p className="text-sm text-muted">{body}</p>
              </div>
            </li>
          ))}
        </ul>

        <DialogClose asChild>
          <Link
            to={MANUAL_PATH}
            onClick={remember}
            className="speech-bubble mt-4 block w-full p-3 text-left text-sm font-medium transition-transform hover:-translate-y-[1px]"
          >
            <span className="inline-flex items-center gap-2 font-bold uppercase tracking-wide">
              <BookOpen className="h-4 w-4" strokeWidth={2.5} />
              Read the full manual
            </span>
            <span className="mt-0.5 block text-muted">
              Board reading, the full editor flow, ratings, comments, accounts
              and the theme switcher.
            </span>
          </Link>
        </DialogClose>

        <label
          htmlFor="welcome-dont-show"
          className="mt-4 flex cursor-pointer items-center gap-2.5 text-sm font-medium text-muted"
        >
          <Checkbox
            id="welcome-dont-show"
            checked={dontShowAgain}
            onCheckedChange={(value) => setDontShowAgain(value === true)}
          />
          Don&rsquo;t show this again
        </label>

        <DialogFooter>
          <DialogClose asChild>
            <Button asChild variant="secondary" onClick={remember}>
              <Link to={MANUAL_PATH}>
                <BookOpen className="h-4 w-4" /> Read the manual
              </Link>
            </Button>
          </DialogClose>
          <Button onClick={close}>Start browsing</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

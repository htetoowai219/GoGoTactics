import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Bookmark,
  Compass,
  Flame,
  Gamepad2,
  Heart,
  Lightbulb,
  MessageSquare,
  Monitor,
  Moon,
  PenLine,
  Rocket,
  Search,
  Settings,
  ShieldAlert,
  Sparkles,
  Star,
  Sun,
  Swords,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Seo } from "../components/Seo";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";

interface SectionProps {
  id: string;
  step?: string;
  icon: LucideIcon;
  title: string;
  children: ReactNode;
}

function Section({ id, step, icon: Icon, title, children }: SectionProps) {
  return (
    <section id={id} className="scroll-mt-24">
      <Card>
        <CardHeader className="flex-row items-center gap-3 space-y-0">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-none border-2 border-foreground bg-primary text-bright-ink shadow-comic-sm -rotate-2">
            <Icon className="h-5 w-5" strokeWidth={2.5} />
          </span>
          <div>
            {step && (
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted">
                Step {step}
              </p>
            )}
            <CardTitle className="text-xl sm:text-2xl">{title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="prose-gogo">{children}</CardContent>
      </Card>
    </section>
  );
}

const SECTIONS = [
  { id: "find", label: "Find lineups" },
  { id: "read", label: "Read one" },
  { id: "build", label: "Build yours" },
  { id: "interact", label: "Interact" },
  { id: "account", label: "Your account" },
  { id: "appearance", label: "Appearance" },
  { id: "tips", label: "Tips & etiquette" },
];

export default function HowToUsePage() {
  return (
    <>
      <Seo
        title="How to use GoGoTactics"
        description="A short manual: browse and filter community lineups, read board positions and strategy notes, build your own lineup in the editor, rate, comment and follow creators."
        pathname="/how-to-use"
      />

      <div className="mx-auto max-w-4xl">
        <header className="relative overflow-hidden rounded-none border-[3px] border-foreground bg-card px-6 py-10 text-center shadow-comic-lg">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(rgba(13,13,13,0.07) 1.5px, transparent 1.5px)",
              backgroundSize: "12px 12px",
            }}
          />
          <div className="relative">
            <Badge variant="gold" className="mb-4 -rotate-2">
              <BookOpen className="h-3 w-3" /> The manual
            </Badge>
            <h1 className="font-display text-4xl uppercase leading-tight tracking-wide sm:text-5xl">
              How to use <span className="text-gradient">GoGoTactics</span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-sm font-medium text-muted sm:text-base">
              Everything you need in seven short parts: find a lineup, read it
              properly, build your own, and help the next player. Takes about
              three minutes.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Button asChild>
                <Link to="/lineups">
                  Browse lineups <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="secondary">
                <Link to="/create-lineup">
                  <PenLine className="h-4 w-4" /> Build a lineup
                </Link>
              </Button>
            </div>
          </div>
        </header>

        <nav
          aria-label="Manual sections"
          className="my-8 flex flex-wrap items-center justify-center gap-2"
        >
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="rounded-none border-2 border-foreground bg-card px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-foreground shadow-comic-sm transition-all hover:-translate-x-[1px] hover:-translate-y-[1px] hover:bg-elevated"
            >
              {s.label}
            </a>
          ))}
        </nav>

        <div className="space-y-6">
          <Section id="find" icon={Compass} title="Find a lineup worth stealing">
            <p>
              The <Link to="/lineups">Explorer</Link> is the front door. It lists
              every published lineup and lets you narrow the list down fast:
            </p>
            <ul>
              <li>
                <strong>Search</strong> — type in the navbar to jump to a lineup,
                hero, commander, synergy or player as you type.
              </li>
              <li>
                <strong>Filters</strong> — season, game mode, difficulty, synergy,
                hero and commander. Filters stack, so you can ask for
                &ldquo;beginner Ironclad, 5-cost carry&rdquo; in one go.
              </li>
              <li>
                <strong>Sort</strong> — newest, top rated, most liked, or{" "}
                <span className="inline-flex items-center gap-1 align-middle">
                  <Flame className="h-3.5 w-3.5 text-orange-400" strokeWidth={3} />
                  trending
                </span>
                , which decays over time so fresh picks rise.
              </li>
            </ul>
            <div className="speech-bubble mt-4 p-3 text-sm font-medium">
              The homepage collects <strong>featured</strong> (editor picks),{" "}
              <strong>trending</strong> and <strong>newest</strong> lineups, plus
              the creators who are most active right now — a good place to start
              if you have no idea what to play.
            </div>
          </Section>

          <Section id="read" icon={Search} title="Read a lineup properly">
            <p>
              Every lineup page is built to be scannable in three passes:
            </p>
            <ol>
              <li>
                <strong>The board.</strong> An interactive preview of the exact
                grid. Hover a hero token for its name, cost and roles; click a
                synergy badge to see who contributes to it.
              </li>
              <li>
                <strong>The shopping list.</strong> Commander and commander skill
                first, then every hero, its itemisation and the note explaining
                why that item is on that unit.
              </li>
              <li>
                <strong>The plan.</strong> The author&rsquo;s written strategy:
                early game, mid game, late game, economy, levelling, positioning
                and tips. Markdown is supported, so lists and emphasis render.
              </li>
            </ol>
            <p>
              Synergy badges show the threshold and the current count, so you can
              see at a glance whether a lineup is played for the 2-piece or the
              4-piece. Star ratings and comments sit at the bottom &mdash; read
              them before copying a build; they are where the &ldquo;works until
              round 12&rdquo; warnings live.
            </p>
          </Section>

          <Section
            id="build"
            step="1"
            icon={Gamepad2}
            title="Build your own lineup"
          >
            <p>
              The editor is a guided, step-by-step builder. It only lets you move
              forward once the current step is valid, so you cannot publish a
              half-finished comp.
            </p>
            <ol>
              <li>
                <strong>Pick a season</strong> — the data set your build belongs
                to.
              </li>
              <li>
                <strong>Pick a game mode</strong> — this sets the board size
                automatically, and the editor resizes the grid.
              </li>
              <li>
                <strong>Choose a commander</strong> and fill in the skill name
                you run. Commanders are the backbone of most comps.
              </li>
              <li>
                <strong>Pick your GoGo cards</strong> — the limited-time cards
                that shape your tempo.
              </li>
              <li>
                <strong>Drag heroes onto the board</strong> — square by square.
                Conflicts and illegal placements are highlighted, and the cost
                counter updates as you go.
              </li>
              <li>
                <strong>Assign equipment</strong> to individual heroes and add a
                short note explaining the choice.
              </li>
              <li>
                <strong>Write the strategy</strong> — early / mid / late game,
                economy, levelling, positioning and tips. This is the part other
                players find most valuable.
              </li>
              <li>
                <strong>Save a draft or publish.</strong> Drafts stay private to
                you; publishing makes the lineup searchable and rateable.
              </li>
            </ol>
            <p>
              Synergies are counted for you as you place units, so you always
              know what a swap does to your breakpoints. You can edit or delete
              your own lineups at any time from the lineup page, and drafts can be
              picked up later from <Link to="/saved">Saved</Link>.
            </p>
            <div className="speech-bubble mt-4 p-3 text-sm font-medium">
              Tip: write the positioning section last. It is the section readers
              screenshot, and it is the one you cannot reconstruct from the
              board image alone.
            </div>
          </Section>

          <Section id="interact" icon={Heart} title="Rate, comment, follow">
            <p>Signing in unlocks the community features:</p>
            <ul>
              <li>
                <Heart className="mr-1 inline h-4 w-4 text-danger" strokeWidth={2.5} />{" "}
                <strong>Like</strong> a lineup you want to come back to.
              </li>
              <li>
                <Bookmark className="mr-1 inline h-4 w-4 text-accent" strokeWidth={2.5} />{" "}
                <strong>Save</strong> it to your private list &mdash; different
                from a like, which is public.
              </li>
              <li>
                <Star className="mr-1 inline h-4 w-4 text-gold" strokeWidth={2.5} />{" "}
                <strong>Rate 1&ndash;5 stars.</strong> One rating per person per
                lineup, changeable at any time. Average and distribution feed the
                &ldquo;top rated&rdquo; sort.
              </li>
              <li>
                <MessageSquare className="mr-1 inline h-4 w-4 text-muted" strokeWidth={2.5} />{" "}
                <strong>Comment</strong> on a lineup or reply to someone else&rsquo;s
                comment &mdash; threads are nested, so counter-strategy discussion
                stays readable.
              </li>
              <li>
                <Users className="mr-1 inline h-4 w-4 text-muted" strokeWidth={2.5} />{" "}
                <strong>Follow</strong> a player from their profile to see their
                published lineups in one place.
              </li>
              <li>
                <ShieldAlert className="mr-1 inline h-4 w-4 text-danger" strokeWidth={2.5} />{" "}
                <strong>Report</strong> broken or copied content. Reports go to the
                moderation queue, not to the author.
              </li>
            </ul>
          </Section>

          <Section id="account" icon={Settings} title="Your account">
            <ul>
              <li>
                <strong>Profile</strong> — avatar and bio, set from{" "}
                <Link to="/settings">Settings</Link>. Avatars are uploaded as
                images and cropped by the app.
              </li>
              <li>
                <strong>Change your password</strong> from the same page. Changing
                it does not log out your other devices, so do it from a trusted
                machine.
              </li>
              <li>
                <strong>Your lineups</strong> are listed on your public profile,
                together with the builds you published, saved and liked.
              </li>
            </ul>
            <p>
              Admins additionally get a <Link to="/admin">dashboard</Link> for
              moderation and for managing the game data (seasons, modes,
              commanders, heroes, synergies, equipment, GoGo cards) that the whole
              site renders from.
            </p>
          </Section>

          <Section id="appearance" icon={Sun} title="Appearance">
            <p>
              The site follows your operating system by default, and you can
              override it any time with the switcher at the bottom of the page:
            </p>
            <ul>
              <li>
                <Sun className="mr-1 inline h-4 w-4 text-gold" strokeWidth={2.5} />{" "}
                <strong>Light</strong> — the classic newsprint look.
              </li>
              <li>
                <Moon className="mr-1 inline h-4 w-4 text-accent" strokeWidth={2.5} />{" "}
                <strong>Dark</strong> — same comic style, ink swapped for night.
              </li>
              <li>
                <Monitor className="mr-1 inline h-4 w-4 text-muted" strokeWidth={2.5} />{" "}
                <strong>System</strong> — follow the OS and switch automatically
                when your machine changes appearance. This is the default.
              </li>
            </ul>
            <p>
              Your choice is remembered on this device only &mdash; there is no
              account setting for it, and clearing site data resets it to System.
            </p>
          </Section>

          <Section id="tips" icon={Lightbulb} title="Tips &amp; etiquette">
            <ul>
              <li>
                <strong>Post a plan, not a screenshot.</strong> A lineup with
                positioning, econ and levelling notes is worth ten boards of
                units.
              </li>
              <li>
                <strong>Credit the source.</strong> If you adapted someone
                else&rsquo;s build, say so in the description and link their
                profile.
              </li>
              <li>
                <strong>Update or archive stale builds.</strong> Game data moves
                fast; a build that no longer works is worse than no build.
              </li>
              <li>
                <strong>Rate honestly.</strong> A 2-star review that explains what
                broke is more useful than a silent 5.
              </li>
              <li>
                <strong>Keep it clean.</strong> No spam, no self-promotion in
                comments, no begging for likes. Report it if you see any.
              </li>
            </ul>
            <div className="mt-4 border-[3px] border-foreground bg-elevated p-4 shadow-comic-sm">
              <h3 className="mt-0 flex items-center gap-2 text-base">
                <Swords className="h-4 w-4" strokeWidth={2.5} /> About this site
              </h3>
              <p className="mb-0 text-sm">
                GoGoTactics is an unofficial, non-commercial fan project.{" "}
                <em>Magic Chess: Go Go</em> is a game by Moonton; we are not
                affiliated with them, and no game assets are used or distributed.
                Everything you see in a fresh install is original sample data
                written to demonstrate the app.
              </p>
            </div>
          </Section>
        </div>

        <div className="mt-8 flex flex-col items-center gap-4 rounded-none border-[3px] border-foreground bg-primary p-8 text-center text-bright-ink shadow-comic-lg">
          <Rocket className="h-8 w-8" strokeWidth={2.5} />
          <h2 className="font-display text-2xl uppercase tracking-wide sm:text-3xl">
            Ready to build?
          </h2>
          <p className="max-w-lg text-sm font-medium">
            Start from a community comp and make it yours, or open a blank board
            and publish the build that wins your lobbies.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button asChild variant="secondary">
              <Link to="/lineups">
                <Trophy className="h-4 w-4" /> Browse lineups
              </Link>
            </Button>
            <Button asChild variant="outline" className="text-bright-ink">
              <Link to="/create-lineup">
                <Sparkles className="h-4 w-4" /> Create a lineup
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

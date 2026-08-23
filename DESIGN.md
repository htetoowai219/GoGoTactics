---
name: GoGoTactics
version: 2.0.0
stack:
  build: "Vite + React 19 + TypeScript"
  styling: "Tailwind CSS v4 (@theme tokens in client/src/index.css)"
  icons: "lucide-react"
  components: "Radix UI primitives, restyled in client/src/components/ui/"

colors:
  # Base Comic Canvas & Ink
  background: "#FAF7EE" # Off-white vintage newsprint (page canvas w/ halftone dots)
  surface: "#FFFDF6" # Input / field paper
  card: "#FFFFFF" # Stark white comic panel
  elevated: "#F3EFE0" # Hover fill / muted panel tint
  ink_black: "#0D0D0D" # ALL borders, text and outlines (--color-border & --color-foreground)
  ink_gray: "#E2DFD2" # Skeleton placeholder halftone

  # High-Impact Pop Colors
  primary_yellow: "#FFE600" # Primary CTA bg — ALWAYS with ink-black text
  accent_cyan: "#00E5FF" # Focus rings, links underline, cyan badges
  danger_magenta: "#FF0055" # Danger variant, destructive accents
  success_green: "#4ADE80" # Success badges/stickers
  gold: "#FACC15" # Featured / gold stickers

  # Hero Gold-Cost Tier Palette (Board.tsx COST_COLORS)
  tier_1: "#D1D5DB"
  tier_2: "#4ADE80"
  tier_3: "#38BDF8"
  tier_4: "#C084FC"
  tier_5: "#FACC15"

typography:
  font_display: "'Bangers', 'Impact'"   # utility: font-display — ALL CAPS titles, dialog headings, hero H1, logo
  font_comic: "'Comic Neue'"            # utility: font-sans (default body) — copy, labels, buttons
  font_mono: "'Space Mono'"             # utility: font-mono — stats, code blocks

radii:
  global: "0px–2px" # --radius-md/lg/xl all overridden to 2px; badges/buttons/inputs fully square

shadows: # Tailwind v4 --shadow-* overrides — NO soft/blurred shadows anywhere
  comic_sm: "shadow-comic-sm"   # 2px 2px 0px #0D0D0D
  comic:    "shadow-comic"      # 4px 4px 0px #0D0D0D (cards, buttons)
  comic_lg: "shadow-comic-lg"   # 8px 8px 0px #0D0D0D (dialogs, hero, sticky bars)
  press:    "active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
---

# Design & UX Philosophy

The interface mimics a **Tactical Manga / Graphic Novel** on vintage newsprint. High-contrast cell-shading, heavy black ink outlines (`border-[3px] border-foreground`), hard offset shadows, halftone dot backgrounds and action-burst stickers make comp sharing feel like reading a strategy comic.

---

# Implemented Foundations

## Tokens (`client/src/index.css` @theme)

- Semantic palette: `background / surface / card / elevated / border(=ink) / foreground(=ink) / muted / primary / accent / gold / danger / success`.
- `--color-border` and `--color-foreground` are both ink black — every default border is a thick ink line.
- Default `shadow-sm|md|lg|xl` are overridden to hard drops, so legacy utilities still render correctly.
- Halftone page texture: body uses `radial-gradient` 1px dots at 14px grid.
- Animations: `animate-fade-in` (pages), `animate-pop` ("POP!" vote burst).

## Utility Classes (index.css)

- `.font-display` — Bangers caps with letter-spacing.
- `.text-gradient` — ink title with yellow double-shadow pop (used on brand name + hero keyword).
- `.card-hover` — hover lifts panel `-2px,-2px` and grows the hard shadow.
- `.speech-bubble` — white rounded bubble with ink border, tail pseudo-elements (synergy callouts).

## Fonts (`client/index.html`)

Google Fonts preconnect + stylesheet loading **Bangers**, **Comic Neue** (400/700), **Space Mono** (400/700).

---

# Key Component Guidelines (as built)

## 1. Panels & Layout

- **Card** (`ui/card.tsx`): `rounded-none border-[3px] border-foreground bg-card shadow-comic`; CardTitle renders Bangers uppercase.
- **Dialog** (`ui/dialog.tsx`): overlay = halftone dot pattern over black/60; content = 3px ink panel with `shadow-comic-lg`; built-in close X gets ink border + primary-yellow hover.
- **Navbar**: solid background, `border-b-[3px]`, logo mark = rotated (`-rotate-3`) yellow sticker tile with Swords icon; nav links are uppercase bold, active = yellow sticker chip.
- **Footer**: full-width `elevated` band under a 3px ink rule.
- **AdminLayout**: standalone sidebar (no site Navbar/Footer), 3px ink divider, active link = yellow sticker chip, bottom section holds View-site / Logout / signed-in handle.

## 2. Controls

- **Button** (`ui/button.tsx`): square, `border-2 border-foreground`, bold uppercase tracking-wide, hard shadow + press physics (`active` shifts down-right, kills shadow). Variants: `default` (yellow/ink), `secondary` (paper), `outline`, `ghost` (flat), `danger` (magenta/white), `gold`, `link`.
- **Badge** (`ui/badge.tsx`): hard-edged sticker — `rounded-none border-2 px-1.5 uppercase shadow-comic-sm`. Variants map to pop colors: default=yellow, success/danger/gold/cyan fills, secondary=paper, outline=white.
- **Input / Textarea / SelectTrigger / SearchBar**: `rounded-none border-2 border-foreground bg-surface`, focus = cyan ring with offset.
- **Tabs**: bordered paper strip; active tab = yellow sticker chip.
- **Dropdown menu**: 3px ink panel + hard drop; items highlight with `elevated`.

## 3. Board & Tokens

- **HeroToken** (`components/Board.tsx`): circular avatar with **3px cell-shaded ink border**; inner ring tinted by gold-cost tier color (`COST_COLORS` 1→5); cost badge = tier-color sticker with 2px ink stroke; 6+ cost uses rainbow conic rim.
- Board tiles sit on newsprint paper; hero placement cells keep ink outlines.

## 4. Team Composition Cards

- **LineupCard**: 3px ink panel with `card-hover`; media area separated by 3px ink rule; season tag & Featured flag are ink-bordered stickers (Featured is gold, slightly rotated); fallback commander portrait = circular 3px ink frame; synergy chip = synergy-color sticker with ink stroke, uppercase.
- Titles use Comic Neue bold; stats/counts use Space Mono where numeric.

## 5. Votes, Dialogs & Feedback

- Upvote buttons trigger `animate-pop` scale burst.
- Toasts/dialog footers inherit button press physics; delete confirmations use the magenta `danger` variant.
- Skeletons: `bg-ink-gray` blocks (no rounded corners).

---

# Do's and Don'ts for AI Coding Agents

### Do's:

- **DO** give new cards/badges/inputs ink borders (`border-2`+ controls, `border-[3px]` panels) and hard shadows (`shadow-comic*`) — never soft blurs.
- **DO** use `font-display` strictly in ALL CAPS for titles, CTAs and rank badges.
- **DO** add small rotations (`-rotate-2` / `rotate-3`) to stickers, logos and featured flags for hand-drawn energy.
- **DO** wire hovers as hard state changes: translate + grow shadow; clicks press down-right and kill the shadow (`active:` utilities).
- **DO** put ink-black text on every pop color (`primary`, `gold`, `success`, tiers); reserve white text for `danger`.

### Don'ts:

- **DON'T** use soft drop-shadows (`rgba` blurs), glassmorphism/backdrop-blur panels, or gradients between colors.
- **DON'T** use thin gray borders or low-contrast dividers — lines are `2px–4px` pure `#0D0D0D`.
- **DON'T** introduce new radius values above 12px (speech bubbles only) or rely on default Tailwind shadows — they're overridden, but prefer explicit `shadow-comic*`.
- **DON'T** hide interactions behind opacity fades; use instant color pops and edge shifts.

---

# File Map

| Concern | File |
| --- | --- |
| Theme tokens, fonts, halftone, utilities | `client/src/index.css` |
| Font loading | `client/index.html` |
| Button / Badge primitives | `client/src/components/ui/{button,badge}.tsx` |
| Panel & overlay primitives | `client/src/components/ui/{card,dialog,tabs,dropdown-menu,select,input,textarea,skeleton,separator,avatar,label}.tsx` |
| Site chrome | `client/src/components/{Navbar,Footer,SearchBar}.tsx`, `client/src/layouts/RootLayout.tsx` |
| Admin chrome | `client/src/layouts/AdminLayout.tsx` |
| Hero tokens & tier palette | `client/src/components/Board.tsx` (`COST_COLORS`, `HeroToken`) |
| Comp cards | `client/src/components/LineupCard.tsx` |

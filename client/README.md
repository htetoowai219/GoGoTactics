# GoGoTactics — Client

React SPA for the GoGoTactics lineup platform. **Self-contained and
independently deployable** — copy this folder anywhere, `npm install`, and it
runs. It shares no code, lockfile or build with the API; the only contract is
the HTTP endpoint configured through `API_URL`.

> Part of an unofficial, non-commercial fan project vibe coded with the
> Big Pickle model of [OpenCode](https://opencode.ai). Not associated with
> Moonton. See the [root README](../README.md) for the full disclaimer.

## Stack

React 18 · TypeScript · Vite 6 · Tailwind CSS v4 · TanStack Query · React Router 6 · Zustand · dnd-kit

## Getting started

```bash
npm install
cp .env.example .env   # optional — see below
npm run dev            # http://localhost:5173
```

## Configuration: build-time vs runtime

Deployment-specific values are resolved at **runtime**, so a single build (or
single container image) can be pointed at any API without rebuilding:

| Value              | Build-time           | Runtime                  | Falls back to        |
| ------------------ | -------------------- | ------------------------ | -------------------- |
| API base URL       | `VITE_API_URL`       | `API_URL`                | `/api/v1` (same origin) |
| Canonical site URL | `VITE_SITE_URL`      | `SITE_URL`               | `window.location.origin` |
| `/api` reverse proxy target | —          | `API_PROXY_TARGET`       | *(disabled)*         |
| Dev-server proxy target      | —          | `DEV_API_PROXY_TARGET`   | `http://localhost:5000` |

Resolution order: **runtime → build-time → origin**. The runtime values come
from `window.__GOGOTACTICS_CONFIG__`, defined in `/runtime-config.js`, which the
container entrypoint regenerates on every boot.

## Environment

| Variable               | Layer        | Default                 | Purpose                                                        |
| ---------------------- | ------------ | ----------------------- | -------------------------------------------------------------- |
| `API_URL`              | runtime      | `/api/v1`               | API base URL. Relative = same origin; use a full URL (`https://api.example.com/api/v1`) for remote APIs |
| `SITE_URL`             | runtime      | request origin          | Canonical site URL for SEO/OG tags                             |
| `API_PROXY_TARGET`     | runtime      | *(empty)*               | API origin the bundled nginx proxies `/api` to; empty = static only |
| `VITE_API_URL`         | build-time   | `/api/v1`               | Baked into the bundle — runtime value wins                     |
| `VITE_SITE_URL`        | build-time   | request origin          | Baked into the bundle — runtime value wins                     |
| `DEV_API_PROXY_TARGET` | dev only     | `http://localhost:5000` | Where `npm run dev` proxies `/api`                             |
| `PORT`                 | dev only     | `5173`                  | Dev server port                                                |

- **Local development:** keep `VITE_API_URL=/api/v1`. Vite proxies `/api` and
  `/uploads` to `DEV_API_PROXY_TARGET`, so the API just needs to be running.
- **Production / remote API:** set `API_URL` to the deployed API base URL. The
  server must allow your frontend origin via its `CLIENT_URL` / `CLIENT_URLS`
  env vars, and cookies require `COOKIE_SECURE=false` unless you serve over TLS.

## Scripts

| Command            | Description                          |
| ------------------ | ------------------------------------ |
| `npm run dev`      | Start Vite dev server                |
| `npm run build`    | Typecheck + production bundle        |
| `npm run preview`  | Serve the production build           |
| `npm run typecheck`| TypeScript only                      |

## Theming

Three appearance options — **Light**, **Dark**, **System** — in the footer
(`src/components/ThemeSwitcher.tsx`).

| Key                            | Meaning                                                         |
| ------------------------------ | --------------------------------------------------------------- |
| `gogotactics-theme`            | `light` \| `dark` \| `system`; unset falls back to `system`      |
| `gogotactics-welcome-dismissed`| `true` once the homepage welcome dialog's "Don't show again" is ticked |

- `src/stores/themeStore.ts` holds the preference and the resolved theme,
  persists it to `localStorage`, and listens to `prefers-color-scheme` so
  **system** follows the OS live.
- The `dark` class is put on `<html>` together with `style.colorScheme` and the
  `theme-color` meta; a pre-paint snippet in `index.html` does this before React
  mounts so the correct theme is painted immediately.
- Colours live as CSS variables in `src/index.css` (`--c-background`,
  `--c-foreground`, `--c-card`, …) and are mapped into Tailwind with
  `@theme inline`; dark mode is a class-based `@custom-variant`.
- `text-bright-ink` is the text colour for bright yellow/cyan/gold/green fills.

Clear both `localStorage` keys in devtools to get back to the defaults.

## Lineup editor on mobile

The board in `src/features/lineups/editor/LineupBuilder.tsx` is built for phones
first. The read-only board in `src/components/Board.tsx` shares the same
`BoardGrid` and `HeroToken` components, so the two never drift apart.

- **No horizontal scrolling.** `BoardGrid` is `w-full` with
  `minmax(0, 1fr)` columns and is only *capped* at `cols × 84`px on wide
  screens. Width is driven by the container, never by the placed heroes — the
  old `w-max` grid grew as soon as a tile had a hero in it.
- **Tokens scale with their tile.** `HeroToken size="cell"` is
  `min(86%, 2.75rem)`, so a token can shrink on a 320px phone but still
  renders at exactly 44px on desktop. It needs a parent with a definite width to
  resolve that percentage against, which is why `PlacedHero` renders `w-full`.
- **Tap first, drag second.** `usePointerFine()` (`src/hooks/usePointerFine.ts`)
  watches `(pointer: fine)`. Drag-and-drop is enabled only for mouse/trackpad;
  on touch the chips carry no `touch-none`, so scrolling from a chip works.
- **Armed selection.** `Selection` is `{ kind: "hero" | "item", id } | null`.
  Tapping a hero or item arms it, tapping a tile drops it, and the bar above the
  board shows what the next tap will do. Items go on heroes only.
- **Swaps confirm.** Tapping or dropping onto an occupied tile sets
  `pendingSwap` and opens a dialog; cancelling keeps the hero armed.
- **`pointerWithin` collision detection** — item chips are wider than a tile, so
  rect-based collision would drop onto a neighbouring cell.
- The synergies card sits above the board on phones and in the right column on
  desktop. On phones it is `hidden` until at least one synergy is active —
  otherwise an empty board greets you with a placeholder above the thing you
  came to use. Desktop keeps the placeholder, since the column is empty anyway.
- Picker view mode (`gogotactics-editor-picker-mode`: `compact` \| `detailed`)
  is remembered per browser; phones default to the icon grid.

The editor exposes `data-board-grid`, `data-board-cell`, `data-cell`,
`data-hero-token`, `data-synergies` and `data-hero` attributes for automated UI
checks.

## Structure

```
src/
├── api/                  # Axios instance + typed endpoint helpers
├── lib/                  # Utils + runtime config resolver
├── components/           # Shared UI (board, cards, comments, theme switcher)
│   └── ui/               # Primitives (button, dialog, select, tabs, checkbox…)
├── features/lineups/editor/  # Interactive lineup builder (mobile-first)
├── layouts/              # RootLayout, AdminLayout, route guards
├── pages/                # Route pages (+ admin/, incl. HowToUsePage)
├── stores/               # Zustand stores (auth, theme)
└── types/                # Shared interfaces

nginx/                    # nginx server-block templates (static / api-proxy)
docker-entrypoint.sh      # Renders the config from env at container start
public/runtime-config.js # Runtime config stub (overwritten in containers)
```

## Deploying

Any static host works (Vercel, Netlify, Cloudflare Pages, nginx, S3…):

```bash
npm run build   # outputs to dist/
```

Serve `dist/` and point `API_URL` at the API — either baked in at build time
(`VITE_API_URL`) or injected at runtime by editing `/runtime-config.js`.

### As a container

```bash
docker build -t gogotactics-client .

# static only — browser talks to the API cross-origin
docker run -p 8080:80 \
  -e API_URL=https://api.example.com/api/v1 \
  -e SITE_URL=https://example.com \
  gogotactics-client

# same-origin — nginx proxies /api to the API (no CORS needed)
docker run -p 8080:80 \
  -e API_URL=/api/v1 \
  -e API_PROXY_TARGET=http://api.example.com \
  gogotactics-client
```

The image is nginx serving the built SPA with history fallback, gzip, immutable
asset caching and a `/healthz` endpoint for container healthchecks.

## License

MIT — see the root [LICENSE](../LICENSE).


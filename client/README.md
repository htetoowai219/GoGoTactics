# GoGoTactics — Client

React SPA for the GoGoTactics lineup platform. **Self-contained** — copy this
folder anywhere, `npm install`, and it runs. No monorepo tooling required.

## Stack

React 18 · TypeScript · Vite 6 · Tailwind CSS v4 · TanStack Query · React Router 6 · Zustand · dnd-kit

## Getting started

```bash
npm install
cp .env.example .env   # optional — see below
npm run dev            # http://localhost:5173
```

## Environment

| Variable        | Default     | Purpose                                                        |
| --------------- | ----------- | -------------------------------------------------------------- |
| `VITE_API_URL`  | `/api/v1`   | API base URL — relative uses the Vite proxy; set a full URL (e.g. `https://api.example.com/api/v1`) for remote APIs |
| `VITE_SITE_URL` | `http://localhost:5173` | Canonical site URL used for SEO/OG tags            |

- **Local development:** keep `VITE_API_URL=/api/v1`. Vite proxies `/api` and
  `/uploads` to `http://localhost:5000` (see `vite.config.ts`), so the API just
  needs to run on port 5000.
- **Production / remote API:** set `VITE_API_URL` to your deployed API base URL.
  The server must allow your frontend origin via its `CLIENT_URL` env var.

## Scripts

| Command            | Description                          |
| ------------------ | ------------------------------------ |
| `npm run dev`      | Start Vite dev server                |
| `npm run build`    | Typecheck + production bundle        |
| `npm run preview`  | Serve the production build           |
| `npm run typecheck`| TypeScript only                      |

## Structure

```
src/
├── api/                  # Axios instance + typed endpoint helpers
├── components/           # Shared UI (board, cards, comments)
│   └── ui/               # Primitives (button, dialog, select, tabs…)
├── features/lineups/editor/  # Interactive lineup builder
├── layouts/              # RootLayout, AdminLayout, route guards
├── pages/                # Route pages (+ admin/)
├── stores/               # Zustand auth store
└── types/                # Shared interfaces
```

## Deploying

Any static host works (Vercel, Netlify, Cloudflare Pages, nginx S3…):

```bash
npm run build   # outputs to dist/
```

Serve `dist/` and either set `VITE_API_URL` at build time to point at the API,
or configure your host to reverse-proxy `/api` → the backend.

## License

MIT — see the root [LICENSE](../LICENSE).

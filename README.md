# GoGoTactics

Community-driven lineup platform for **Magic Chess: Go Go** — browse, build, and share tactical lineups with a visual board editor, ratings, comments, follows, and moderation tooling.

<p align="center">
  <img src="./assets/demo.png" alt="GoGoTactics — homepage with trending lineups on the comic-book UI" width="100%" />
</p>

> Fan-made demo project. All game data (seasons, commanders, heroes, synergies, equipment) is sample content rendered dynamically — no real game assets are used or distributed.

## Tech Stack

| Layer    | Tech                                                                 |
| -------- | -------------------------------------------------------------------- |
| Frontend | React 18, TypeScript 5, Vite 6, Tailwind CSS v4, TanStack Query, React Router 6 |
| UI       | Radix UI primitives, lucide-react, sonner (toasts), dnd-kit (board editor) |
| Backend  | Node.js ≥ 20, Express 4, TypeScript                                  |
| Database | MongoDB + Mongoose                                                   |
| Auth     | JWT in httpOnly cookies, bcrypt password hashing                     |
| Uploads  | Cloudinary (avatars, lineup thumbnails, game-data images)            |
| SEO      | react-helmet-async meta tags + JSON-LD structured data               |

The UI follows a **tactical-manga / comic-book design system** — see [`DESIGN.md`](./DESIGN.md).

## Project Structure

The repo is a plain container for two **fully self-contained apps** — there is no
root package.json. Each folder has its own dependencies, lockfile, env config and
scripts, so either can be copied elsewhere or deployed on its own.

```
GoGoTactics/
├── client/                  # React SPA (self-contained)
│   └── src/
│       ├── api/             # Axios instance + typed endpoint helpers
│       ├── components/      # Shared UI (cards, comments, editor states)
│       │   └── ui/          # Primitives (button, dialog, select, tabs…)
│       ├── features/
│       │   └── lineups/editor/  # Board editor, lineup state
│       ├── layouts/         # RootLayout, AdminLayout, route guards
│       ├── pages/           # Route pages (+ admin/)
│       ├── stores/          # Zustand auth store
│       └── types/           # Shared TypeScript interfaces
├── server/                  # Express API (self-contained)
│   └── src/
│       ├── config/          # Env validation (zod), DB, Cloudinary
│       ├── controllers/     # Route handlers
│       ├── middleware/      # Auth, rate limiting, errors, uploads
│       ├── models/          # Mongoose schemas
│       ├── routes/v1/       # REST routes
│       ├── services/        # Tokens, trending score
│       ├── validators/      # Zod request schemas
│       └── seed/            # Sample data seeder
└── DESIGN.md                # Design system documentation
```

## Requirements

| Tool       | Version    | Notes                                            |
| ---------- | ---------- | ------------------------------------------------ |
| Node.js    | **≥ 20**   | Includes npm                                     |
| MongoDB    | 6 / 7      | Local (`mongod`) or a free MongoDB Atlas cluster |
| Cloudinary | —          | Free account — only needed for image uploads     |

Check your setup:

```bash
node -v    # should print v20.x or higher
mongosh    # or: mongod --version
```

---

## Installation & Setup

### Step 1 — Clone and enter the project

```bash
git clone <your-fork-url> gogotactics
cd gogotactics
```

### Step 2 — Set up the API (`server/`)

```bash
cd server
npm install
cp .env.example .env
```

Edit `server/.env`:

```ini
# Required in development
MONGODB_URI=mongodb://127.0.0.1:27017/gogotactics   # or your Atlas URI
JWT_SECRET=change-me-to-a-long-random-string

# Image uploads — EITHER format works:
CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud_name>
# ...or the three separate keys:
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=your-api-secret
```

Then seed the database and start the API:

```bash
npm run seed     # wipes MongoDB and loads sample data
npm run dev      # API on http://localhost:5000
```

Verify: open http://localhost:5000/api/v1/game-data/all — you should get JSON.

### Step 3 — Set up the client (`client/`) in a new terminal

```bash
cd client
npm install
cp .env.example .env   # optional — defaults work for local dev
npm run dev            # Vite on http://localhost:5173
```

Open **http://localhost:5173** 🎉

In local development the Vite proxy forwards `/api` and `/uploads` to
`http://localhost:5000`, so no CORS configuration is needed.

### Seeded accounts

All seeded users share the password `password123`:

| Username                          | Role  |
| --------------------------------- | ----- |
| `gogoadmin`                       | admin |
| `tactifox`, `moonwarden`, `shadowstep`, `oakheart` | user |

Log in as `gogoadmin` to access the admin dashboard at `/admin`.

### Environment variable reference

**`server/.env`**

| Variable              | Default                                   | Notes                                        |
| --------------------- | ----------------------------------------- | -------------------------------------------- |
| `PORT`                | `5000`                                    |                                              |
| `NODE_ENV`            | `development`                             | `production` enforces the requirements below |
| `MONGODB_URI`         | `mongodb://127.0.0.1:27017/gogotactics`   |                                              |
| `JWT_SECRET`          | dev fallback                              | **Required**, must change in production      |
| `JWT_EXPIRES_IN_DAYS` | `7`                                       |                                              |
| `CLIENT_URL`          | `http://localhost:5173`                   | CORS allow-list for the frontend             |
| `CLOUDINARY_URL`      | —                                         *or* the three keys below                    |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | —     | Optional in dev, required in production |
| `TRENDING_GRAVITY`    | `1.5`                                     | Trending score decay                         |

**`client/.env`**

| Variable        | Default                 | Notes                                                    |
| --------------- | ----------------------- | -------------------------------------------------------- |
| `VITE_API_URL`  | `/api/v1`               | Relative = use Vite proxy; full URL for remote APIs       |
| `VITE_SITE_URL` | `http://localhost:5173` | Canonical URL used for SEO / Open Graph tags              |

### Running against separate hosts

Because both apps are decoupled, deploy them independently:

```bash
# client/.env
VITE_API_URL=https://api.example.com/api/v1

# server/.env
CLIENT_URL=https://example.com
```

### Production build & deploy

```bash
# Server
cd server && npm run build && npm start     # serves dist/ on $PORT

# Client
cd client && npm run build                  # static bundle in dist/
npm run preview                             # test it locally
```

Serve the client build from any static host / CDN and point `VITE_API_URL` at
the API. Behind a reverse proxy that terminates TLS, forward `X-Forwarded-*`
headers to the API.

---

## Scripts

All scripts run inside `client/` or `server/` — nothing runs from the repo root.

| Folder  | Command             | Description                        |
| ------- | ------------------- | ---------------------------------- |
| server  | `npm run dev`       | Dev API with watch/reload          |
| server  | `npm run seed`      | Wipe & reseed MongoDB              |
| server  | `npm run build`     | Typecheck + compile to `dist/`     |
| server  | `npm start`         | Run built server                   |
| server  | `npm run typecheck` | TypeScript only                    |
| client  | `npm run dev`       | Vite dev server                    |
| client  | `npm run build`     | Typecheck + production bundle      |
| client  | `npm run preview`   | Serve the production build locally |
| client  | `npm run typecheck` | TypeScript only                    |

---

## Features

### Public
- **Home** — featured lineups, trending (gravity-weighted score), latest builds
- **Explorer** — search, filter by season/mode/synergy/hero/difficulty, sort (newest, top rated, most liked, trending), pagination
- **Lineup detail** — interactive board preview, hero equipment & notes, synergy thresholds, strategy sections (early/mid/late/economy/leveling), star ratings, threaded comments with likes, share buttons
- **Profiles** — bios, avatars, follow system, published lineups
- **Search** — debounced typeahead across lineups/heroes/commanders/synergies/users

### Authenticated
- Lineup builder: pick season → mode (dynamic board size) → commanders & gogo cards → place heroes via drag-and-drop → assign equipment → auto-computed synergies → strategy markdown → publish or save draft
- Edit/delete own lineups, like/save, rate 1–5 stars, comment, follow, report

### Admin (`/admin`)
- Dashboard with live stats
- Lineup moderation: feature ★, hide/publish, delete
- User management: ban/unban
- Report queue: resolve/dismiss with notes
- **Game data manager**: CRUD with Cloudinary image uploads for seasons, game modes (board size!), commanders, heroes, synergies, equipment, gogo cards — including batch delete; no code changes needed to add new content

## API Overview

Base URL `/api/v1`. All responses `{ success, data }` or `{ success: false, message }`.

| Area       | Endpoints                                                            |
| ---------- | -------------------------------------------------------------------- |
| Auth       | register, login, logout, me, change-password                         |
| Users      | profile, lineups, follow/unfollow, saved, liked                      |
| Lineups    | CRUD + list w/ filters, like, save, rate, trending                   |
| Comments   | list (threaded), create, like, delete                                |
| Game data  | public read (`/game-data/all`)                                       |
| Search     | `/search/suggest?q=`                                                 |
| Reports    | create (authed)                                                      |
| Admin      | stats, users/status, lineups/status·feature·delete, reports, game-data CRUD (+ batch delete) |

Auth uses httpOnly cookie `token` (7-day expiry). Client sends `withCredentials`.

## Security Notes

- Passwords hashed with bcrypt (cost 12)
- JWT secret validated via zod; required (plus Cloudinary credentials) in production
- Rate limiting on all `/api` routes
- Ownership checks on edit/delete; role-gated admin routes
- Input validation on every write endpoint
- `.env` files are gitignored — never commit real secrets

---

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| `EADDRINUSE :::5000` on server start | Another process holds port 5000 (often an old `npm run dev`). Kill it: `lsof -nP -iTCP:5000 -sTCP:LISTEN` then `kill <PID>` — or set `PORT` to another value and update the client's Vite proxy target. |
| Server logs show MongoDB connection errors | Make sure `mongod` is running (`brew services start mongodb-community` on macOS) or point `MONGODB_URI` at Atlas. |
| `Image uploads are not configured` / `Must supply api_key` | Fill the Cloudinary variables in `server/.env` (single `CLOUDINARY_URL` **or** the three separate keys), then restart `npm run dev`. Test creds resolve with a quick upload from Admin → Game Data. |
| Missing game data / old schema after pulling changes | Re-seed: `cd server && npm run seed`. |
| Login/register fails silently | Check the browser console + network tab; confirm the API is reachable and `CLIENT_URL` matches the frontend origin. |

---

## License

Released under the [MIT License](./LICENSE).

Third-party assets and services remain the property of their respective owners:

- **Magic Chess: Go Go** is a game by Moonton — this is an unofficial fan project, not affiliated with or endorsed by Moonton. No game assets are included; all data is original sample content.
- Fonts (Bangers, Comic Neue, Space Mono) are loaded from Google Fonts under the SIL Open Font License.
- Dependencies are licensed by their respective authors (see each package's license via `npm ls --long` or [libraries.io](https://libraries.io)).

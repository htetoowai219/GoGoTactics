# GoGoTactics — Server

Express REST API for the GoGoTactics lineup platform. **Self-contained** — copy
this folder anywhere, `npm install`, and it runs. No monorepo tooling required.

## Stack

Node.js ≥ 20 · Express 4 · TypeScript · MongoDB (Mongoose) · JWT auth (httpOnly cookies) · Zod validation · Cloudinary uploads

## Getting started

```bash
npm install
cp .env.example .env
npm run seed     # optional: wipe & reseed sample data
npm run dev      # http://localhost:5000
```

Requires a reachable MongoDB (`mongodb://127.0.0.1:27017/gogotactics` by default).

## Environment

All variables are validated with zod at startup (`.env.example` documents them):

| Variable                 | Default                              | Notes                                  |
| ------------------------ | ------------------------------------ | -------------------------------------- |
| `PORT`                   | `5000`                               |                                        |
| `MONGODB_URI`            | `mongodb://127.0.0.1:27017/gogotactics` |                                     |
| `JWT_SECRET`             | dev fallback                         | Must change in production (enforced)   |
| `JWT_EXPIRES_IN_DAYS`    | `7`                                  |                                        |
| `CLIENT_URL`             | `http://localhost:5173`              | CORS allow-list for the frontend       |
| `CLOUDINARY_*`           | *(optional in dev)*                  | Required together in production        |
| `TRENDING_GRAVITY`       | `1.5`                                | Trending score decay                   |

In production, `MONGODB_URI`, `JWT_SECRET` and all Cloudinary keys are required.

## Scripts

| Command             | Description                        |
| ------------------- | ---------------------------------- |
| `npm run dev`       | Dev server with watch/reload (tsx) |
| `npm run build`     | Typecheck + compile to `dist/`     |
| `npm start`         | Run compiled server                |
| `npm run typecheck` | TypeScript only                    |
| `npm run seed`      | Wipe & reseed MongoDB              |

## API

Base URL `/api/v1` — responses are `{ success, data }` or `{ success: false, message }`.
Auth is an httpOnly `token` cookie; the client must send credentials.
Interactive areas: auth, users/follows, lineups (CRUD, like/save/rate/trending),
threaded comments, game-data reads, search, reports, admin CRUD.

## Structure

```
src/
├── config/          # Env validation (zod), DB, Cloudinary
├── controllers/     # Route handlers
├── middleware/      # Auth, rate limiting, errors, uploads
├── models/          # Mongoose schemas
├── routes/v1/       # REST routes
├── services/        # Tokens, trending score
├── validators/      # Zod request schemas
└── seed/            # Sample data seeder
```

## Deploying

```bash
npm run build   # outputs to dist/
npm start       # node dist/server.js
```

Point `MONGODB_URI` at your database, set `CLIENT_URL` to the deployed frontend
origin (used for CORS), and provide production secrets. Behind a reverse proxy,
forward `X-Forwarded-*` headers if you terminate TLS upstream.

## License

MIT — see the root [LICENSE](../LICENSE).

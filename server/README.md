# GoGoTactics — Server

Express REST API for the GoGoTactics lineup platform. **Self-contained and
independently deployable** — copy this folder anywhere, `npm install`, and it
runs. It shares no code, lockfile or build with the web client; the only
contract is CORS plus `MONGODB_URI`, both plain environment variables.

> Part of an unofficial, non-commercial fan project vibe coded with the
> Big Pickle model of [OpenCode](https://opencode.ai). Not associated with
> Moonton. See the [root README](../README.md) for the full disclaimer.

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
| `HOST`                   | `0.0.0.0`                            | `127.0.0.1` keeps the API local-only   |
| `MONGODB_URI`            | `mongodb://127.0.0.1:27017/gogotactics` |                                    |
| `JWT_SECRET`             | dev fallback                         | Must change in production (enforced)   |
| `JWT_EXPIRES_IN_DAYS`    | `7`                                  |                                        |
| `CLIENT_URL`             | `http://localhost:5173`              | Primary CORS origin                     |
| `CLIENT_URLS`            | —                                    | Extra CORS origins, comma-separated     |
| `ALLOW_ANY_ORIGIN`       | `false`                              | Dev-only: accept any origin             |
| `TRUST_PROXY`            | `true`                               | Honour `X-Forwarded-*` behind a proxy   |
| `COOKIE_SECURE`          | `NODE_ENV === production`            | Force the auth cookie's `Secure` flag   |
| `CLOUDINARY_*`           | *(optional in dev)*                  | Required together in production        |
| `REQUIRE_CLOUDINARY`     | `true`                               | `false` boots without upload credentials |
| `TRENDING_GRAVITY`       | `1.5`                                | Trending score decay                   |

In production, `MONGODB_URI`, `JWT_SECRET` and all Cloudinary keys are required
(unless `REQUIRE_CLOUDINARY=false`).

CORS is an explicit allow-list: a request whose `Origin` is not in
`CLIENT_URL` + `CLIENT_URLS` is rejected. Add or remove frontends by editing env
vars only — no code change, no redeploy. The resolved list is logged on boot.

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

`GET /health` (outside `/api/v1`) is a rate-limit-free liveness probe used by
the container healthcheck and load balancers.

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

Point `MONGODB_URI` at your database, set `CLIENT_URL` (plus `CLIENT_URLS` for
any extra frontends), and provide production secrets. Behind a reverse proxy,
keep `TRUST_PROXY=true` and set `COOKIE_SECURE=true` once TLS is terminated.

### As a container

```bash
docker build -t gogotactics-server .

docker run -p 5000:5000 \
  -e MONGODB_URI=mongodb+srv://…/gogotactics \
  -e JWT_SECRET=$(openssl rand -hex 32) \
  -e CLIENT_URL=https://example.com \
  -e CLIENT_URLS=https://staging.example.com \
  -e COOKIE_SECURE=true \
  gogotactics-server
```

The image is a non-root Node 22 runtime with production dependencies only and a
`/health` healthcheck. A second stage runs the sample-data seeder:

```bash
docker build --target seed -t gogotactics-server:seed .
docker run --rm -e MONGODB_URI=… gogotactics-server:seed
```

Or run the whole stack with `docker compose up -d --build` from the repo root.

## License

MIT — see the root [LICENSE](../LICENSE).


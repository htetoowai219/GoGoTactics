# syntax=docker/dockerfile:1
#
# GoGoTactics API — standalone image. Build from the repo root or from this folder:
#   docker build -t gogotactics-server ./server
#   docker build -t gogotactics-server --target seed ./server

# ---------- build (full toolchain, compiles TypeScript) ----------
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---------- seed (sample data loader: `docker compose run --rm seed`) ----------
# Inherits the toolchain so the TypeScript seeder can run with tsx.
# NODE_ENV is intentionally left at development: seeding must not require
# production secrets (JWT/Cloudinary) to be present.
FROM build AS seed
CMD ["npx", "tsx", "src/seed/run-seed.ts"]

# ---------- prod dependencies ----------
FROM node:22-alpine AS prod-deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# ---------- runtime ----------
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=5000
COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node package*.json ./
USER node
EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||5000)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "dist/server.js"]

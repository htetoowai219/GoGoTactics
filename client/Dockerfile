# syntax=docker/dockerfile:1
#
# GoGoTactics web client — static SPA served by nginx.
#   docker build -t gogotactics-client ./client
#
# Build args only seed the bundle; runtime env (API_URL / SITE_URL /
# API_PROXY_TARGET) is injected at container start and wins.

# ---------- build ----------
FROM node:22-alpine AS build
WORKDIR /app
ARG VITE_API_URL=/api/v1
ARG VITE_SITE_URL=
ENV VITE_API_URL=$VITE_API_URL \
    VITE_SITE_URL=$VITE_SITE_URL
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---------- runtime ----------
FROM nginx:1.27-alpine AS runtime
ENV API_URL=/api/v1 \
    SITE_URL= \
    API_PROXY_TARGET=
COPY nginx/ /etc/nginx/gogotactics/
COPY docker-entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=5 \
  CMD wget -q --spider http://127.0.0.1/healthz || exit 1
ENTRYPOINT ["/entrypoint.sh"]

#!/bin/sh
# Renders the nginx server block and the SPA runtime config from environment
# variables at container start, so a single image can be pointed at any API
# without rebuilding the frontend.
set -eu

TEMPLATE_DIR=/etc/nginx/gogotactics
CONF_DIR=/etc/nginx/conf.d
RUNTIME_CONFIG=/usr/share/nginx/html/runtime-config.js

API_URL="${API_URL:-/api/v1}"
SITE_URL="${SITE_URL:-}"
API_PROXY_TARGET="${API_PROXY_TARGET:-}"

# Templates live outside /etc/nginx/templates on purpose: the nginx base image
# auto-renders that directory and would inject a second, conflicting server
# block. Drop any leftovers first.
rm -f "$CONF_DIR"/default*.conf

if [ -n "$API_PROXY_TARGET" ]; then
  envsubst '${API_PROXY_TARGET}' < "$TEMPLATE_DIR/default-with-proxy.conf.template" > "$CONF_DIR/default.conf"
  echo "client: /api proxied to $API_PROXY_TARGET"
else
  cp "$TEMPLATE_DIR/default-static.conf.template" "$CONF_DIR/default.conf"
  echo "client: static only, browser calls API at $API_URL"
fi

cat > "$RUNTIME_CONFIG" <<EOF
window.__GOGOTACTICS_CONFIG__ = {
  apiUrl: "$API_URL",
  siteUrl: "$SITE_URL"
};
EOF

exec /docker-entrypoint.sh nginx -g 'daemon off;'

#!/bin/sh
set -e

# Read cluster/host DNS resolver from /etc/resolv.conf so nginx can resolve
# upstream hostnames lazily at request time (not at startup).
NAMESERVER=$(awk '/^nameserver/{print $2; exit}' /etc/resolv.conf)
export NAMESERVER
export BACKEND_URL="${BACKEND_URL:-http://dormwatch-backend-v1.dormwatch-backend-v1.svc.cluster.local:8000}"

# Substitute only our two placeholders; nginx $variables are left intact.
envsubst '${NAMESERVER} ${BACKEND_URL}' \
  < /etc/nginx/conf.d/default.conf.template \
  > /etc/nginx/conf.d/default.conf

exec nginx -g "daemon off;"

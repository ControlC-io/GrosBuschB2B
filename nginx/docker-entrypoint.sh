#!/bin/sh
set -eu

: "${MAIN_APP_DOMAIN:?MAIN_APP_DOMAIN is required}"
: "${ADMIN_APP_DOMAIN:?ADMIN_APP_DOMAIN is required}"
: "${EXTERNAL_API_UPSTREAM:=127.0.0.1:1}"

envsubst '${MAIN_APP_DOMAIN} ${ADMIN_APP_DOMAIN} ${EXTERNAL_API_UPSTREAM}' \
  < /etc/nginx/nginx.coolify.template \
  > /etc/nginx/nginx.conf

exec nginx -g 'daemon off;'

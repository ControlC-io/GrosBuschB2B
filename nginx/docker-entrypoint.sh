#!/bin/sh
set -eu

: "${MAIN_APP_DOMAIN:=_}"
: "${EXTERNAL_API_UPSTREAM:=127.0.0.1:1}"

envsubst '${MAIN_APP_DOMAIN} ${EXTERNAL_API_UPSTREAM}' \
  < /etc/nginx/nginx.prod.template \
  > /etc/nginx/nginx.conf

exec nginx -g 'daemon off;'

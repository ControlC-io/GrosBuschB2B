FROM nginx:alpine

RUN apk add --no-cache gettext

COPY nginx/nginx.coolify.conf /etc/nginx/nginx.coolify.template
COPY nginx/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/docker-entrypoint.sh"]

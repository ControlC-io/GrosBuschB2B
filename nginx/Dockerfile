FROM nginx:alpine

RUN apk add --no-cache gettext

COPY nginx/nginx.prod.conf /etc/nginx/nginx.prod.template
COPY nginx/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/docker-entrypoint.sh"]

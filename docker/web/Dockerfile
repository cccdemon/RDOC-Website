FROM nginxinc/nginx-unprivileged:1.27-alpine

LABEL org.opencontainers.image.title="rdoc-web" \
      org.opencontainers.image.description="Raumdock website – HTML pages" \
      org.opencontainers.image.source="https://raumdock.org"

COPY docker/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html datenschutz.html 404.html site.webmanifest /usr/share/nginx/html/

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O- http://127.0.0.1:8080/healthz >/dev/null 2>&1 || exit 1

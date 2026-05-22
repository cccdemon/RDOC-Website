FROM php:8.3-apache-bookworm

LABEL org.opencontainers.image.title="rdoc-api" \
      org.opencontainers.image.description="Raumdock website – PHP API endpoints (Twitch/Discord/RSI)" \
      org.opencontainers.image.source="https://raumdock.org"

# curl-CLI für HEALTHCHECK; PHP-curl-Extension ist bereits Teil von php:8.3-apache
RUN apt-get update \
 && apt-get install -y --no-install-recommends curl ca-certificates \
 && rm -rf /var/lib/apt/lists/*

# Apache auf 8080 umstellen, damit der Container ohne CAP_NET_BIND_SERVICE laufen kann
RUN sed -i 's/^Listen 80$/Listen 8080/' /etc/apache2/ports.conf \
 && sed -i 's/:80>/:8080>/' /etc/apache2/sites-available/000-default.conf

# Standard-Index entfernen, API einkopieren, statischer Healthcheck
RUN rm -f /var/www/html/index.html
COPY api/ /var/www/html/api/
RUN echo "ok" > /var/www/html/healthz \
 && chown -R www-data:www-data /var/www/html

# Apache braucht als Non-Root (www-data / uid 33) Schreibrechte für Logs + PID-Datei.
# Ohne diese chowns startet der Container in K8s mit runAsNonRoot:true nicht.
RUN chown -R www-data:www-data \
      /var/log/apache2 \
      /var/run/apache2 \
 && chmod -R u+rwX \
      /var/log/apache2 \
      /var/run/apache2

# Basis-Hardening: PHP-Version nicht ausplaudern
RUN { \
      echo 'expose_php = Off'; \
      echo 'display_errors = Off'; \
      echo 'log_errors = On'; \
    } > /usr/local/etc/php/conf.d/zz-hardening.ini

# Server-Tokens minimal halten
RUN { \
      echo 'ServerTokens Prod'; \
      echo 'ServerSignature Off'; \
      echo 'TraceEnable Off'; \
    } > /etc/apache2/conf-available/zz-hardening.conf \
 && a2enconf zz-hardening

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -sfo /dev/null http://127.0.0.1:8080/healthz || exit 1

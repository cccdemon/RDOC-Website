# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Static website for **Raumdock (RDOC)** — a German-language Star Citizen org. Public site at `raumdock.org`. The page itself is plain HTML/CSS/vanilla JS (no build step, no framework, no package manager). It calls a thin PHP API that proxies Twitch, Discord and RSI.

The financial sub-site at `financial.raumdock.org` is a separate project (`cc-financial`) and not part of this repo.

## Three-container split

The site is *not* served as one app. `docker-compose.yml` builds three images that sit behind an nginx reverse proxy:

| Container | Image | Serves | Source |
|---|---|---|---|
| `web` | `nginx:alpine` | `index.html`, `datenschutz.html`, `404.html`, `site.webmanifest` | `docker/web/Dockerfile` |
| `assets` | `nginx:alpine` | `/assets/*` (CSS, JS, images, fonts) | `docker/assets/Dockerfile` |
| `api` | `php:8.3-apache` | `/api/*.php` | `docker/api/Dockerfile` |
| `proxy` | `nginx:alpine` | routes `/`, `/assets/`, `/api/` to the above; exposes `:8080` | `docker/proxy/nginx.conf` |

Important consequences:

- The `web` nginx config (`docker/web/nginx.conf`) **deliberately returns 404** for `/assets/` and `/api/` — those paths must be routed by the proxy. Don't "fix" this by copying assets into the web container.
- Each container has its own `/healthz` endpoint used by Docker `HEALTHCHECK` and the Helm chart's probes.
- All containers `EXPOSE 8080` and run as non-root (apache as uid 33, nginx-unprivileged as uid 101) — required for Kubernetes `runAsNonRoot: true`.

## Run locally

```powershell
# Bring up the full stack on http://localhost:8080
docker compose up --build

# Rebuild only one component
docker compose up --build web
docker compose up --build assets
docker compose up --build api
```

The API needs credentials for Twitch and Discord. Either set them in the shell before `docker compose up`:

```powershell
$env:TWITCH_CLIENT_ID = "..."
$env:TWITCH_CLIENT_SECRET = "..."
$env:DISCORD_BOT_TOKEN = "..."
$env:DISCORD_GUILD_ID  = "..."
```

…or drop a non-web-accessible `api/.env` (KEY=VALUE per line). `env_get()` in every PHP file checks env vars first, then `./api/.env`. `.env` is gitignored *and* `.dockerignore`'d — never bake it into an image.

There is **no build step, no test suite, no linter** in this repo. "Running" means `docker compose up`, or just opening `index.html` in a browser if you're only touching HTML/CSS.

## Deploy

There's a Helm chart in [helm/rdoc/](helm/rdoc/) — `Chart.yaml`, [helm/rdoc/values.yaml](helm/rdoc/values.yaml), and templates for the three Deployments/Services, ConfigMap (`ALLOWED_ORIGIN`), Secret (Twitch/Discord creds), and Ingress.

Images are expected at `ghcr.io/<org>/rdoc-{web,assets,api}:<tag>`. The user runs deploys themselves — prepare artifacts in the repo, don't try to SSH into prod or push images.

## Frontend conventions

- **Cache-busting is manual.** [index.html](index.html) loads assets with `?v=YYYYMMDD-tag` query strings (e.g. `styles.css?v=20260513-rsi-members`). The assets container sets `Cache-Control: public, max-age=31536000, immutable` — so when you change a CSS/JS file in `assets/`, bump the `?v=...` string in `index.html` or the change won't reach users.
- **HTML is never long-cached** (`Cache-Control: no-cache, must-revalidate`) — small files, must propagate immediately.
- The Twitch embed in [index.html](index.html) hardcodes `parent=raumdock.org`. Local testing won't show the player unless you also pass `parent=localhost`.
- Navigation lives in two places: desktop `.mn` block and the mobile drawer `#drw .mn-m`. Keep them in sync.
- All JS files are vanilla, plain `<script defer>`. No bundler, no transpilation.

## PHP API endpoints

Under [api/](api/):

- `twitch-live.php?logins[]=foo&logins[]=bar` — server-side check via Twitch Helix; returns `{live: [...]}`. Used to show the `LIVE` badge.
- `discord-events.php` / `discord-events.ics.php` — pulls scheduled events from Discord guild.
- `rsi-members.php` — scrapes the public RSI org page to populate the Members section.

All four share the same `env_get($key)` pattern (env var → `api/.env` fallback) and emit `Access-Control-Allow-Origin: $ALLOWED_ORIGIN`. Default is `https://raumdock.org`; override via the `ALLOWED_ORIGIN` env var (set on the `api` container, surfaced via the Helm ConfigMap).

## Things that look wrong but aren't

- [public/](public/) and [index.html-old](index.html-old) are **legacy / not used by any build** — they're in `.dockerignore` and `.gitignore` ignores `*.md`/`pictures/`/`public/`. Don't touch them as part of normal work; treat them as historical.
- Both [datenschutz.html](datenschutz.html) and [404.html](404.html) are copied into the web container alongside `index.html` — keep them stylistically consistent when restyling.

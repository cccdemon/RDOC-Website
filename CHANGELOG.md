# Changelog

## 2026-06-09 — Content pass: quotes, pets, Flotte removal

- **Auswahl (`#auswahl`)**: "RMT" → "Echtgeldhandel"; new "Nichts für dich"
  point on Unverbindlichkeit; new "Für dich"-Punkt "Zusagen einhalten".
- **Removed Flotte section** (old section 08, `#flotte`): section markup,
  desktop + mobile + ops-log nav links, OPS-bar live fleet-count item
  (`#ops-flotte`) and its `flotteCount()` JS in `main.js`, command-palette
  placeholder example.
- **Removed both Husky/Wolf-Guardian images**: hero `flagship` bg repointed
  `husky-guardian.png` → `paladin-guardian-v3.png` (the active default hero was
  the dog due to swapped `[data-hero]` labels); Brand-Kit wallpaper card
  re-imaged to `paladin-guardian-v3.png`.
- **New section 08 `#haustiere`** — "Orgabegleiter (unsere Haustiere)".
- **New section 09 `#zitate`** — real crew Funksprüche (Moe, Headwig,
  JerichoRamirez, HolderdiePolder, Jazzz, Gleet) + "mehr folgen" note;
  added "Zitate" nav link in all three nav menus.
- Renumbered `sec-num` 09→15 to stay sequential after the two inserts.
- Cache-bust `?v=20260609-overhaul` → `?v=20260609-quotes` (index + ops-log).

## 2026-06-09 — Complete overhaul pass

Visual + content + feature overhaul of the public site. No build step changed;
still plain HTML/CSS/vanilla JS + PHP API. Visual language stays inside the
RDOC `streamer-card` system (thin cyan borders, gold corner ticks, mono labels)
per `RDOC-Assets/STYLE.md` — explicitly **not** the generic-AI-poster look.

### Content / honesty (no invented facts)
- **New `#kodex` section** (`index.html` section 03): the real 13-rule community
  codex, with **Regel 12 — Unzuverlässigkeit & Verbindlichkeit** highlighted as
  the featured rule. Source: RDOC Discord Regelwerk.
- Removed **fabricated crew "Haltung" quotes** — crew cards now show only photo,
  role and name (real data).
- Removed the **fabricated example AARs** from `ops-log.html` and the index
  teaser (invented dates / crews / lessons). Ops-Log now renders only real
  concluded operations from the Fleetmanager via `/api/ops-log.php`
  (`?past=1`, completed/cancelled), with an honest empty state when none exist.
- Hero: dropped member-count as the lead vanity stat (contradicts Regel 11
  "Aktivität statt Zahlen") — added an "Aktivität, nicht Mitgliederzahlen" note
  and demoted the live RSI count to a small stat.
- Swapped generic `/assets/shots/*.jpg` imagery for real RDOC-Assets keyvisuals
  and mission images (band divider, tradition cards, fleet ships, brand-kit
  previews).
- **Ship imagery corrected.** The `rdoc-2026-flagships-*` / `hero-paladin-v3`
  renders do **not** actually depict the Anvil Paladin or RSI Perseus (generic
  AI capital ships) — so they are no longer shown or labelled as those ships.
  Replaced everywhere (hero, band, fleet cards, brand-kit wallpaper, OG/Twitter/
  schema image) with real RDOC **identity** motives: helm (amber visor), wolf/
  husky guardian, dock/space-ops keyvisuals. Fleet section keeps the real ship
  names + specs as text; the card visuals are identity art, not ship photos.
  Fixed the `wir-sind` figure alt/caption that wrongly claimed "Anvil Paladin".
  (Legacy `assets/styles.css` still references the old render but is unused —
  active pages load `rdoc2.css`.)

### Features (vanilla JS, in `assets/main.js`)
- **OPS-STATUS bar** in the header: live Twitch state, next-op countdown (from
  `/api/discord-events.php` ISO start times) and live RSI fleet count — real
  data only.
- **Command palette** (`Ctrl/⌘-K` or `/`): jump to any section / external link.
- **Accent toggle** (cyan ↔ gold) via existing `[data-accent]`, persisted to
  `localStorage`.
- Scroll-progress hairline, scroll-reveal on sections/cards, subtle hero
  parallax — all gated behind `prefers-reduced-motion`.

### Pages
- `index.html`: nav (desktop + drawer) extended with Kodex; sections renumbered
  03–14.
- `ops-log.html`: live AAR engine, real empty state, nav synced.
- `404.html`: rebuilt as a "SIGNAL LOST" console screen (gold corner chrome,
  shows the requested path).
- `datenschutz.html`: minor restyle to match (mono eyebrow + back button).

### Ops / deploy notes
- Cache-bust bumped to `?v=20260609-overhaul` on `rdoc2.css` and the JS bundle
  across `index.html` and `ops-log.html`.
- Brand-kit downloads point at real existing `/assets/*.png` assets (wallpaper,
  banner, overlay, helm avatar) — they download now, nothing 404s. Swap to
  dedicated kit files later.
- Onboarding section (05) rewritten to the truth: there is no onboarding funnel —
  "Ask one to be one". Removed the fabricated T+1/T+3/W+1/M+1 timeline; FAQ updated.
- Ops-Log source is overridable via `RDOC_OPSLOG_URL` (defaults to
  `<RDOC_SUITE_EVENTS_URL>/?past=1`).

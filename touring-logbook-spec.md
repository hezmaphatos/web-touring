# Touring Logbook: build spec

Working title: **Logbook** (read from `SITE_NAME`, easy to rename).
Site and admin language: Indonesian. This document is in English for precision.

---

## 0. How to work (read first)

- Read this whole file before writing code. Execute the phases in section 12 in order, without waiting for approval between phases.
- Do not ask questions. When something is ambiguous, pick the simplest option that satisfies this spec and log it in `DECISIONS.md` (one line: decision, reason).
- Work in small increments. After each phase: run build, lint and tests, fix failures, then commit as `phase N: <summary>`. Never start a phase on a failing build.
- Follow the conventions in this spec exactly. Prefer the simpler solution; add no abstraction the spec does not need.
- Never invent facts about trips (dates, distances, stories). Seed data uses clearly marked placeholders (section 10).
- This is one person's touring journal. There is exactly one admin.

---

## 1. Product

A personal website that tells the owner's motorcycle touring journey across Java (and beyond, for decades to come). It is portfolio-like in spirit, but the "career" is the road: every trip is a chapter, the motorcycle (Yamaha XSR 155, modified adventure style) is the thread through all of them.

Two sides:

1. **Public site**: an interactive, animation-rich, editorial/brutalist showcase of trips, routes, photos, videos, the bike, and cumulative stats.
2. **Admin panel**: simple. The owner logs in and adds or edits trips: where, when, distance, description, photos, YouTube videos, stops.

Content is dynamic: publishing a trip in admin updates the public site without a redeploy.

Goals: look unmistakably hand-designed (not a template, not "AI-looking"), feel fast on a mid-range Android phone over mobile data, and stay maintainable by one person.

---

## 2. Stack and repo layout

Monorepo:

```
/backend      Laravel (API + admin)
/frontend     Next.js (public site)
/DECISIONS.md
/README.md    run, build, env, deploy notes
```

| Concern | Choice |
|---|---|
| Backend | Latest stable Laravel, PHP 8.3+, MySQL or PostgreSQL (default to MySQL), queue driver `database` |
| Admin | Latest stable Filament, panel at `/admin`, locale `id` |
| Media | `spatie/laravel-medialibrary`, conversions processed on a queue |
| Markdown | `league/commonmark` (strip raw HTML, no unsafe links), rendered server-side |
| Frontend | Next.js App Router, TypeScript, React |
| Styling | Plain CSS with CSS variables and CSS Modules. **No Tailwind default theme, no UI kit** (no shadcn, MUI, Chakra, Radix themes) |
| Motion | GSAP (core, ScrollTrigger, Flip), Lenis for smooth scroll |
| Map | `d3-geo`, `d3-zoom`, `topojson-client`. **No Mapbox, Google Maps, or Leaflet** |
| WebGL | `three`, used **only** on the trips ledger (section 5.3), lazy-loaded |
| Images in frontend | Plain `<img>` with `srcset` from API variants. Do not use `next/image` optimization (variants are pre-generated) |

Env (put in `.env.example`, never commit real secrets):

- backend: `APP_URL`, `FRONTEND_URL` (CORS allow-list), `FRONTEND_REVALIDATE_URL`, `REVALIDATE_SECRET`, `ADMIN_EMAIL`, `SITE_NAME`
- frontend: `NEXT_PUBLIC_API_URL`, `API_URL` (server-side), `REVALIDATE_SECRET`, `SITE_NAME`

---

## 3. Design direction

### 3.1 Identity

The site should look **poured, not designed**: raw concrete ground, thick black rules, flat color blocks taken from real Indonesian road signage, and enormous type. Everything borrowed from the road: asphalt with a yellow center line, kilometer posts (patok KM), brown tourism signs, green direction signs.

### 3.2 Principles

1. **Photos are the loudest content.** UI recedes; photos are shown at their natural aspect ratio, never forced into a uniform grid.
2. **Data is layout.** Kilometers, elevation and dates are large typographic elements set on ruled rows, not "stat cards".
3. **Structure carries information.** A rule marks a chapter boundary. A color block tells the terrain type. A number is a real sequence (trip number, km marker). Nothing is decorative.
4. **One star per page.** Each page gets exactly one memorable motion moment (section 5). Everything around it stays quiet.
5. **Scroll is distance.** Motion responds to the visitor's action (scroll, hover, tap). Motion without input exists only in the home opening sequence.
6. **Voice.** First person, plain Indonesian ("aku"), sentence case, specific over clever.

### 3.3 Tokens

Color (all CSS variables on `:root`):

| Name | Hex | Role |
|---|---|---|
| `--beton` | `#CBCAC4` | Page ground (raw concrete, cool grey) |
| `--hitam` | `#000000` | Type, rules, borders (true black) |
| `--kapur` | `#F5F5F2` | Photo mats, panels, text on colored blocks |
| `--marka` | `#F2C200` | Road-marking yellow: route center line, current position, focus, active state. The only accent |
| `--pantai` | `#0D4F9E` | Chapter color for `coast` trips (facility-sign blue) |
| `--gunung` | `#6A3B1D` | Chapter color for `highland` trips (tourism-sign brown) |
| `--rimba` | `#0A6B43` | Chapter color for `forest` trips (direction-sign green) |

`city` trips have no color: they use the inverse (black block, `--kapur` text).
Verify WCAG AA for every text/background pair actually used.

Type (exactly two families, self-hosted via `next/font`):

- **Archivo** (variable, with the `wdth` and `wght` axes): all display text, headings, labels, data, UI. Headlines use weight 800-900. Data and UI labels use semi-condensed weight 500-600. Use `font-variant-numeric: tabular-nums` where supported.
- **Newsreader** (variable, with `opsz`): story body text. Size 1.125-1.25rem, line-height 1.6, measure max 62ch.
- No monospace anywhere. No Inter, Roboto, Space Grotesk, Playfair.

Scale: display = fit-to-width (see 5.4), h2 `clamp(2.5rem, 7vw, 7rem)`, data-large `clamp(3rem, 9vw, 9rem)`, body 18-20px, smallest text 14px.

Layout:

- 12-column grid, gutter 16px (mobile) / 24px (desktop), page margin 16px / 40px, max content width 1600px.
- Everything is **left-aligned**. Only the odometer is centered. Large headings may deliberately bleed past the right edge (clip, do not wrap).
- Rules are 3px solid `--hitam`. Border radius is 0 everywhere. No shadows.
- Mobile first: single column, headline sizes via `clamp`.

### 3.4 Forbidden (explicit anti-template list)

- No gradients as decoration, no glassmorphism, no soft shadows, no blur.
- No pastel "sticker" boxes with hard offset shadows (that is a different template).
- No grid of identical rounded cards. No card layouts for trips at all.
- No centered hero with a "Welcome to my journey" line, no 3-column feature row.
- No tracked-out ALL-CAPS eyebrow labels above headings. No labels written as `WORD — fragment`. No `A · B · C` meta strings. No `→` appended to link or button text.
- No `01 / 02 / 03` numbering unless the content really is a sequence (trip order and km markers are; sections are not).
- No emoji. No icon-library icons as decoration (functional icons only, simple custom SVG).
- No accenting a single word in a headline with italic or a different color.
- No fade-and-slide-up entrance on every section. No hover transition on every element.
- No cream background with a terracotta accent, no near-black background with an acid-green accent.
- Pure `#000`, never tinted near-black.

---

## 4. Motion rules

- GSAP drives all animation. Lenis provides smooth scroll, synced to ScrollTrigger (`lenis.on('scroll', ScrollTrigger.update)`, GSAP ticker drives `lenis.raf`). Lenis must not hijack touch scrolling.
- Scroll-scrubbed motion uses linear easing. Settling motion uses `expo.out` / `power3.out`. No bounce, no elastic.
- Typography may respond to scroll velocity through the Archivo `wdth` axis (62 to 125), smoothed with `gsap.quickTo`, clamped, returning to 100 when idle. Apply only to elements marked `data-flex-width` (stop names, pull quotes, trip titles in ledger). Never body text.
- **Reduced motion** (`prefers-reduced-motion: reduce`): no scrubbing, no velocity effect, no opening sequence, no page-transition wipe. Final states render immediately.
- **Low-end fallback**: a `useLowEnd()` hook returns true if `navigator.hardwareConcurrency <= 4` or `navigator.deviceMemory <= 4` or `saveData` is on. When true: no WebGL, no velocity-width, shortened opening sequence.
- Page transition: a full-height block in the destination's chapter color wipes across (clip-path, 350-500ms) like a vehicle passing, then new content mounts. Implement with a `TransitionLink` component that plays the cover animation, calls `router.push`, then reveals. Skip under reduced motion.

---

## 5. Information architecture and pages

Routes and nav (plain text links, current page marked with a thick underline):

| Route | Nav label |
|---|---|
| `/` | (site name) |
| `/trip` | Trip |
| `/trip/[slug]` | |
| `/peta` | Peta |
| `/garage` | Garage |
| `/statistik` | Statistik |
| `/next-ride` | Next ride |
| `/tentang` | Tentang |

Global nav: a thin bar with a 3px bottom rule. Site name left, links right, and a tiny live odometer readout of total km. On mobile, the menu opens as a full-screen list of huge text links (height reveal only).

### 5.1 Shared map engine (`frontend/lib/geo`)

- Base data: Natural Earth 10m admin-1 (provinces), filtered to Indonesia, converted to simplified TopoJSON (`mapshaper`, target under 300 KB) saved at `frontend/public/geo/indonesia-admin1.topo.json`. Java provinces for default framing: ISO 3166-2 `ID-BT`, `ID-JK`, `ID-JB`, `ID-JT`, `ID-YO`, `ID-JI`. If the download is impossible, fall back to the `world-atlas` npm package (Indonesia country outline) and log it in `DECISIONS.md`.
- The projection is **fitted to the bounding box of the visible trips** (not hard-coded to Java), so trips outside Java work later.
- Landmass: stroke only (3px black), no fill, on `--beton`. Province lines 1px.
- **Route rendering**: take the trip's stop coordinates (or `route_geojson` if present), project them, and draw a smooth curve (`d3.line().curve(d3.curveCatmullRom.alpha(0.5))`). Draw two paths: a black "asphalt" path (6px, round caps) and a yellow dashed "center line" path (2px, `stroke-dasharray: 10 14`) on top. The draw animation reveals both using the same progress (mask or `pathLength` normalization).
- A small yellow square marks the current position along the route (`getPointAtLength`).
- Stops are drawn as small black squares with the stop name set in Archivo on hover/focus.
- Planned trips (status `planned`) are drawn dashed black with no yellow center line.
- Without GPX, routes are approximations through stops. This is intentional and acceptable.

### 5.2 Home `/`

**Star: opening sequence (odometer into map).** First visit per session only (`sessionStorage`), skippable by click, key or scroll, total under 6 seconds:

1. 0-0.4s: pure black screen.
2. 0.4-2.4s: a mechanical odometer (centered, white digits in a thick frame) rolls from all zeros to the owner's total km. Each digit is a vertical strip 0-9; strips roll with right-to-left stagger (units fastest). Minimum 5 digits.
3. 2.4-3.0s: hold.
4. 3.0-3.8s: the odometer frame moves (GSAP Flip) to the nav readout position while the black background gives way to `--beton` via a growing clip-path.
5. 3.8-5.8s: every published trip route draws on the map in chronological order, overlapping.

After the sequence, the page becomes a **pinned map section**: scrolling steps through trips chronologically. The projection eases to each trip's bounding box, a left panel shows that trip's title, dates and km in huge type, and a link "Buka cerita" goes to the chapter. Below the pinned section: the latest trip as a full-bleed cover with its title set huge, then the footer.

Reduced motion / low-end: no rolling, the final number and all routes render immediately; the pinned section becomes a normal list.

### 5.3 Trips ledger `/trip`

**Star: cursor-following preview with WebGL distortion.**

- Every published trip is a full-width row separated by 3px rules: trip number (real chronological sequence), title set huge in Archivo, year and km right-aligned. Rows are plain text, not cards.
- On hover, the row background switches to the trip's chapter color and a preview of the cover follows the cursor. The preview is a Three.js plane with a small displacement shader driven by cursor velocity (liquid distortion). One shared canvas, one plane, texture swapped per row. Lazy-load `three` only on this page.
- Touch devices and low-end: no WebGL. Tapping a row expands it inline with the cover image and a "Buka cerita" link.
- Filters: plain text toggles for year and terrain type, state in the URL query string.
- Empty state: "Belum ada trip yang dipublikasikan. Tambah trip pertama lewat halaman admin."

```
+--------------------------------------------------------------+
| 7    DIENG                                       2026   612 km|  <- 3px rule below
| 6    TELOMOYO                                    2025   488 km|
| 5    ...                                                       |
+--------------------------------------------------------------+
```

### 5.4 Trip chapter `/trip/[slug]`

**Star: ride mode.**

1. **Title block**: the destination name set in Archivo 900, fitted to the viewport width (JS fit-text, one line), on a block in the trip's chapter color. Below it, one ruled row with date range, km, max elevation and duration, in large data type.
2. **Route strip**: a map of just this trip. On desktop, sticky in a right rail; on mobile, a thin strip pinned under the nav. Its route draws as the visitor scrolls through the chapter, with the yellow position marker moving along it.
3. **Story**: the markdown description in Newsreader. Each stop begins with a **km marker block** (shaped like a patok KM: tall rectangle, white body, black text) showing cumulative km and the stop name (`data-flex-width`). Photos and videos attached to a stop appear after that stop's text; unattached ones follow the story.
4. **Photo flow**: photos at natural aspect ratio. Layout rule: landscape = full-bleed or 8 columns, portrait = 5 columns offset alternately left/right with the caption beside it, bottom-aligned. Captions are plain sentences. `loading="lazy"`, explicit `width`/`height`, LQIP placeholder.
5. **Video**: YouTube embed inside a thick black frame, using a click-to-load facade (thumbnail first, iframe on click) on `youtube-nocookie.com`. Never autoplay.
6. **Pull quote** (if set): set huge across the full width, `data-flex-width`.
7. **Footer**: previous and next trip as huge text links, with a ghost of their route behind.

**Ride mode details:**

- A fixed vertical gauge on the left edge: a thick bar that fills with scroll progress through the chapter, with a readout in km (`progress * distance_km`). It is hidden on mobile in favor of the route strip.
- Velocity-driven `wdth` effect on stop names and the pull quote (section 4).

```
+--------------------------------------------------------------+
|######################## DIENG ###############################|  <- chapter color block, fit-text
|--------------------------------------------------------------|
| 10 Jan - 12 Jan        612 km        2.093 m        3 hari    |
+--------------------------------------------------------------+
| |gauge|   [ story text, 62ch ]                  [ route strip ]|
```

### 5.5 Map `/peta`

**Star: year scrubber.** Full-viewport map with all published routes, pan and zoom (`d3-zoom`). A horizontal scrubber by year: dragging it reveals routes chronologically. Clicking a route opens a side sheet with the trip title, km, cover and "Buka cerita". The selected route thickens and takes its chapter color. A text list of trips (screen-reader and no-JS alternative) sits below the map.

### 5.6 Garage `/garage`

**Star: hotspot spec sheet.** One large photo of the bike (from settings). Hotspots (small yellow squares at percent coordinates set in admin) open that modification's details: part, brand, category, installed date, the owner's note. Below the photo, a ruled table of all modifications. Hotspot items without coordinates appear only in the table.

### 5.7 Stats `/statistik`

**Star: bars that grow.** No stat cards. A ruled list of facts, each with a huge number: total km, trips, days on the road, highest point, provinces visited, photos, videos. Under it, hand-built SVG bars of km per year (thick black bars, no chart library) that grow from zero as they enter the viewport. All numbers are computed by the backend (5.9).

### 5.8 Next ride `/next-ride`

Planned trips (status `planned`) listed with dashed routes on the shared map, a planned timeframe (free text, such as "musim kemarau 2027") and the owner's note on why. Quiet page: no special motion beyond the shared route draw.

### 5.9 About `/tentang`

Markdown text from settings, a portrait photo, bike name, and links to YouTube and Instagram. Quiet page, no motion beyond the page transition.

### 5.10 404

Road-closed theme: diagonal yellow/black chevron band (CSS only). Copy: "Halaman ini nggak ada. Mungkin link-nya salah atau trip-nya belum dipublikasikan." with a plain link "Kembali ke daftar trip".

---

## 6. Data model

```
users           standard Laravel users table (single admin)

trips
  id, title, slug (unique), type enum[coast,highland,forest,city],
  status enum[draft,published,planned],
  started_at date null, ended_at date null,
  distance_km decimal(8,1) null, max_elevation_m int null,
  summary string(180) null,          -- one line for the ledger
  description longtext null,         -- markdown
  pull_quote string null,
  planned_for string null,           -- free text, used when status = planned
  route_geojson json null,           -- optional; future GPX/GeoJSON import
  timestamps
  media: collection "cover" (single)

trip_stops
  id, trip_id, position int, name, province null,
  lat decimal(10,7), lng decimal(10,7),
  km_marker decimal(8,1) null,       -- cumulative km at this stop
  note text null                     -- short markdown

trip_photos
  id, trip_id, stop_id null, position int, caption string null
  media: collection "image" (single)

trip_videos
  id, trip_id, stop_id null, position int,
  youtube_url string, youtube_id string, title string null

garage_items
  id, name, category string, description text null (markdown),
  installed_at date null, hotspot_x decimal(5,2) null, hotspot_y decimal(5,2) null,
  position int
  media: collection "photo" (single, optional)

settings   (key string primary, value longtext null)
  keys: site_name, about_markdown, bike_name, bike_photo (media path),
        youtube_url, instagram_url
```

Rules:

- Only `published` trips appear in public APIs (except `planned` in the next-ride and map endpoints, flagged as planned). Drafts are never exposed.
- Trip **number** is computed (rank by `started_at` among published trips), not stored.
- `youtube_id` is parsed from `youtube_url` (watch, youtu.be, shorts, embed forms); reject invalid URLs with a clear validation message.
- Provinces visited = distinct non-null `province` values across stops of published trips.

---

## 7. Backend

### 7.1 Coding standards (strict)

- **Layering is strict: Controller -> Service -> Model.** Controllers only validate input, call one Service method, and return the response. No queries and no business logic in controllers. Services hold all business logic and call Models. No extra repository layer.
- **No Laravel collection helpers.** Do not use `collect()` or Collection method chains (`map`, `filter`, `pluck`, `groupBy`, `sum`, ...). Convert query results to arrays and use plain PHP (`foreach`, `array_*`).
- **Access query results as arrays**: `$trip['title']`, never `$trip->title`.
- **No queries inside loops.** Use eager loading, `whereIn`, joins, or a single aggregate query.
- Form Requests for validation. Small, single-purpose Service classes (`TripService`, `StatsService`, `MapService`, `GarageService`, `SiteService`, `MarkdownService`, `YoutubeService`, `CoordinateService`).
- **Filament exception**: Filament owns the controller layer for the admin. Keep Filament Resource classes as configuration only; any logic (coordinate parsing, YouTube parsing, number computation, revalidation) lives in Services called from them.

### 7.2 Public API (read-only, JSON, prefix `/api/v1`, throttled)

| Endpoint | Returns |
|---|---|
| `GET /site` | site name, about, bike info, social links, `total_km` (for the odometer), counts |
| `GET /trips` | published trips for ledger, home and map: number, slug, title, summary, type, dates, distance, cover, stops (lat/lng/name) |
| `GET /trips/{slug}` | full trip (below), 404 for drafts |
| `GET /map` | all published and planned trips with stops and route data |
| `GET /stats` | computed stats and km per year |
| `GET /garage` | garage items with photo variants |
| `GET /next-rides` | planned trips |

Shape of `GET /trips/{slug}` (shape only, values illustrative):

```json
{
  "slug": "...", "number": 0, "title": "...", "summary": "...",
  "type": "highland", "status": "published",
  "started_at": "YYYY-MM-DD", "ended_at": "YYYY-MM-DD",
  "distance_km": 0.0, "max_elevation_m": 0,
  "pull_quote": null, "description_html": "<p>...</p>",
  "cover": { "srcset": "url 800w, url 1600w", "src": "url", "width": 0, "height": 0,
             "placeholder": "data:image/webp;base64,...", "alt": "..." },
  "stops": [{ "id": 0, "name": "...", "province": null, "lat": 0, "lng": 0,
              "km_marker": null, "note_html": null }],
  "photos": [{ "id": 0, "stop_id": null, "caption": null, "image": { } }],
  "videos": [{ "id": 0, "stop_id": null, "youtube_id": "...", "title": null }],
  "route_geojson": null,
  "prev": { "slug": "...", "title": "..." },
  "next": { "slug": "...", "title": "..." }
}
```

### 7.3 Stats (`StatsService`)

Computed with aggregate queries, not loops: total km (sum of `distance_km`), trip count, days on the road (sum of inclusive date ranges), highest point (max `max_elevation_m`), provinces visited, photo count, video count, km per year.

### 7.4 Media pipeline

- Accept jpg, png, webp, avif. Max 25 MB per file.
- Conversions (WebP, and AVIF if the driver supports it): widths 480, 800, 1200, 1600, 2400, plus `lqip` (24px wide WebP, inlined in the API as a data URI).
- **Public variants must contain no EXIF or GPS metadata** (this protects the owner's location data). Originals are stored privately and never served.
- Store width/height of the largest variant; the API always returns them (prevents layout shift).
- Alt text: use the caption, falling back to "{trip title}".

### 7.5 Caching and revalidation

- Cache API responses (`Cache::remember`) with keys invalidated by model observers.
- On any save/delete of trips, stops, photos, videos, garage items or settings, dispatch a queued job that calls `FRONTEND_REVALIDATE_URL` with `REVALIDATE_SECRET` and a tag (`trips`, `garage`, `site`).
- CORS: allow only `FRONTEND_URL`.

---

## 8. Admin (Filament, simple)

- Single admin, login at `/admin`, Indonesian UI. Artisan command `app:create-admin` reads `ADMIN_EMAIL` and prompts for the password. No default password anywhere.
- **Trips resource**, form in sections:
  - Dasar: title, slug (auto from title, editable), type, status, start and end date, one-line summary.
  - Angka: distance (km), max elevation (m).
  - Cerita: description (markdown editor), pull quote, planned timeframe (only visible when status is `planned`).
  - Cover: single image.
  - Titik singgah: reorderable repeater. Fields: name, province, **coordinates as one text field** that accepts a pasted `lat, lng` copied from Google Maps (parsed and validated by `CoordinateService`), km marker, short note.
  - Foto: reorderable repeater. Each item: image (required), caption, optional stop (select from this trip's stops). Multi-file bulk add is a bonus, not required.
  - Video: reorderable repeater. Each item: YouTube link (validated, `youtube_id` parsed), optional title, optional stop.
- **Garage resource**: name, category, description, installed date, optional photo, hotspot X/Y as 0-100 numbers with a helper text explaining them.
- **Pengaturan page**: the settings keys from section 6.
- Dashboard: nothing custom. Navigation labels in Indonesian.
- Buttons and toasts use the same verb: "Simpan" and "Tersimpan", "Publikasikan" and "Dipublikasikan".

---

## 9. Frontend architecture

```
frontend/
  app/                 routes (server components by default)
  components/          UI, one folder per feature (Odometer, RouteMap, Ledger, Chapter, Garage ...)
  lib/api.ts           typed fetchers (fetch with next: { tags })
  lib/types.ts         API types
  lib/geo/             projection, route path, topojson loading
  lib/motion/          gsap setup, lenis provider, hooks (useReducedMotion, useLowEnd)
  styles/              tokens.css, global.css (CSS Modules next to components)
  app/api/revalidate/  POST handler, checks REVALIDATE_SECRET, calls revalidateTag
```

- Fetch on the server with tags (`trips`, `garage`, `site`) and a fallback `revalidate` of 3600 seconds. Client components only for interactive parts.
- Dynamic-import `three` (ledger only) and `d3-zoom` (`/peta` only).
- `generateMetadata` per trip: title, description from `summary`, Open Graph image from the largest cover variant up to 1200px wide. Add `sitemap.xml` and `robots.txt`.
- Register GSAP plugins once in a client-only setup module. Clean up every ScrollTrigger and tween on unmount (`gsap.context`).

---

## 10. Seed data

Seed (idempotent) so the site is never empty on first run. All seeded trips are `draft` except where noted, and all copy is clearly placeholder (`TODO: isi cerita`). **Do not invent dates, distances or stories.** Leave `started_at`, `distance_km`, `description` null.

Destinations visited so far (create one trip each, `published`, so the map, ledger and routes can be verified; the owner will fill in details in admin):

| Trip | Type | Approximate coordinate (verify in admin) |
|---|---|---|
| Sawarna | coast | -6.99, 106.31 |
| Ujung Kulon | forest | -6.75, 105.33 |
| Citorek | highland | -6.79, 106.19 |
| Bandung | city | -6.91, 107.61 |
| Majalengka | highland | -6.84, 108.23 |
| Dieng | highland | -7.20, 109.91 |
| Telomoyo | highland | -7.38, 110.40 |
| Gunungkidul | coast | -8.03, 110.60 |

Each seeded trip gets a single stop at that coordinate (a real route needs more stops, the owner adds them). Because dates are null, order the seeded trips as listed above until real dates are entered. Provide a placeholder cover generated locally (a flat color block in the chapter color with the trip name), not a stock photo. Seed one planned trip ("Contoh rencana") so `/next-ride` can be verified, and mark it clearly as an example.

---

## 11. Quality floor

- **Performance**: mobile Lighthouse performance >= 85 on a trip page with 30 photos; CLS < 0.05; JS for `/trip/[slug]` under 250 KB gzipped (no `three` there). Lazy-load below-the-fold images, `decoding="async"`, `content-visibility: auto` on long photo sections.
- **Accessibility**: visible keyboard focus everywhere (4px black outline with 3px offset, yellow background on dark blocks). Real `<a>`/`<button>` elements. Every motion-based interaction has a static equivalent. The map has a text alternative (the trip list). Correct `lang="id"`. Contrast AA for all used pairs.
- **Responsive**: verify 360px, 768px, 1280px, 1920px widths. Nothing scrolls sideways except intentional clipped headings.
- **Security**: drafts never leave the API; uploads validated by real MIME type; admin login throttled; API read-only; CORS restricted; revalidate endpoint requires the secret; YouTube is rendered only from the parsed ID.
- **Tests (backend)**: unit tests for `StatsService`, `YoutubeService`, `CoordinateService`, trip numbering; feature tests for each public endpoint including "draft is 404". Frontend must pass `tsc`, lint and `next build`.

---

## 12. Build phases

Each phase ends with passing build/lint/tests and a commit.

**Phase 0: scaffold.** Monorepo, Laravel and Next.js projects, env examples, lint/format config, `DECISIONS.md`, README with run commands.
*Done when:* both apps start locally and the README commands work.

**Phase 1: backend core.** Migrations, models, services, markdown rendering, seeders (section 10), public API (section 7.2), tests.
*Done when:* all endpoints return correct JSON for seeded data, drafts 404, tests pass.

**Phase 2: admin and media.** Filament panel and resources (section 8), Spatie media conversions (section 7.4, including EXIF stripping), cache invalidation and the revalidate job, `app:create-admin`.
*Done when:* creating a trip with stops, photos and a YouTube video in admin appears in the API with working variants.

**Phase 3: frontend foundation.** Tokens, fonts, global layout and nav (with odometer readout, static), Lenis provider, hooks, `TransitionLink`, typed API client, static `/trip` ledger (no WebGL yet), 404.
*Done when:* the ledger renders real API data in the final visual style at all four widths.

**Phase 4: chapter page.** Title block (fit-text), data row, story with km marker blocks, photo flow, YouTube facade, pull quote, prev/next. No ride mode yet.
*Done when:* a seeded trip with test photos and a video renders correctly, no layout shift.

**Phase 5: map engine and home.** Geo data prep (5.1), route component with draw animation, home opening sequence and pinned scrub section, `/peta` with zoom and year scrubber.
*Done when:* routes draw correctly for all seeded trips, the opening plays once per session and is skippable, reduced motion works.

**Phase 6: ride mode and ledger WebGL.** Gauge, route strip scrub, velocity `wdth` effect, ledger cursor preview with the shader and touch/low-end fallbacks.
*Done when:* scrolling a chapter drives gauge and route; the ledger hover works on desktop and degrades on touch and low-end.

**Phase 7: remaining pages.** `/garage`, `/statistik`, `/next-ride`, `/tentang`.
*Done when:* all four pages render from real data with their one star each.

**Phase 8: polish and ship-readiness.** Page transitions, reduced-motion and low-end audit, accessibility pass, performance pass against section 11, metadata/sitemap, README deploy notes (two apps, env vars, queue worker, storage, scheduler not required).
*Done when:* section 13 checklist passes.

---

## 13. Definition of done

- [ ] Admin can create, edit and publish a trip with stops, photos and YouTube videos, and the public site updates without a redeploy.
- [ ] All routes in section 5 exist and match their descriptions, each with exactly one star motion moment.
- [ ] Nothing on the forbidden list (3.4) appears anywhere.
- [ ] Reduced-motion and low-end modes work and look intentional, not broken.
- [ ] Lighthouse, CLS and JS-size targets (section 11) are met or the gap is logged in `DECISIONS.md`.
- [ ] Public images contain no EXIF/GPS data.
- [ ] Backend tests, `tsc`, lint and `next build` all pass.
- [ ] README lets the owner run, build and deploy everything.

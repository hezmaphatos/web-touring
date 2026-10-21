# Logbook

A personal motorcycle touring journal. Two apps in one repo:

```
backend/    Laravel 13: public read-only JSON API (/api/v1) and the Filament admin (/admin)
frontend/   Next.js 16: the public site
```

The admin writes to the database; the backend then tells the frontend which data changed (a queued webhook), so a published trip shows up without a redeploy. Decisions that interpret or deviate from the spec are listed in `DECISIONS.md`.

## Requirements

- PHP 8.3+ with `gd` (WebP; AVIF is used when GD has it), `intl`, `exif`, `fileinfo`, `mbstring`, `pdo_mysql` (or `pdo_sqlite`), `zip`
- Composer 2
- Node.js 20.9+ and npm
- MySQL 8 or MariaDB 10.6+ (SQLite works for a quick local run)

On the development machine PHP 8.4 lives at `C:\Users\natan\tools\php84` (the XAMPP PHP is 8.2, too old for Laravel 13). Put it first on `PATH`, for example in Git Bash: `export PATH="/c/Users/natan/tools/php84:$PATH"`. MySQL comes from Laragon (8.0, user `root` without a password, databases `logbook` and `logbook_test`).

## Run locally

Backend:

```sh
cd backend
cp .env.example .env            # then set DB_*, ADMIN_EMAIL and REVALIDATE_SECRET (any long random string)
composer setup                  # install, app key, migrate, storage:link
php artisan db:seed             # placeholder trips and settings (safe to re-run)
php artisan app:create-admin    # creates the admin for ADMIN_EMAIL, asks for a password
php artisan serve               # http://localhost:8000 (terminal 1)
php artisan queue:work --timeout=600   # terminal 2: image variants and frontend revalidation
```

For SQLite instead of MySQL, set `DB_CONNECTION=sqlite`, remove the other `DB_*` lines and create `database/database.sqlite`.

Frontend:

```sh
cd frontend
npm install
cp .env.example .env.local      # REVALIDATE_SECRET must equal the backend's
npm run dev                     # http://localhost:3000 (terminal 3)
```

The admin panel is at http://localhost:8000/admin. Uploaded photos appear on the site after the queue worker has made their variants (a few seconds per photo, mostly AVIF encoding).

## Checks

```sh
cd backend  && composer lint && composer test
cd frontend && npm run lint && npm run typecheck && npm run build   # the build needs the API running
```

Backend tests use in-memory SQLite by default. To run them against MySQL, point the environment at an empty test database:

```sh
DB_CONNECTION=mysql DB_DATABASE=logbook_test DB_USERNAME=root DB_PASSWORD= php artisan test
```

## Deploy

Two apps, typically on two hostnames, for example `api.example.com` (backend) and `example.com` (frontend). There is no scheduler or cron job to set up.

### Backend

1. Web server document root: `backend/public`. PHP limits for photo uploads: `upload_max_filesize = 30M`, `post_max_size = 64M`, `memory_limit = 512M` or more.
2. Install and configure:

   ```sh
   cd backend
   composer install --no-dev --optimize-autoloader   # also publishes the Filament assets
   cp .env.example .env && php artisan key:generate
   php artisan migrate --force
   php artisan storage:link
   php artisan db:seed --force        # only on the first deploy
   php artisan app:create-admin       # only once (run again to change the password)
   php artisan config:cache && php artisan route:cache && php artisan view:cache
   ```

3. `.env` for production:

   | Key | Value |
   |---|---|
   | `APP_ENV`, `APP_DEBUG` | `production`, `false` |
   | `APP_URL` | `https://api.example.com` (image URLs are built from it) |
   | `DB_*` | the MySQL database |
   | `SITE_NAME` | site name used until it is set in Pengaturan |
   | `ADMIN_EMAIL` | the one admin account |
   | `FRONTEND_URL` | `https://example.com` (the only CORS origin) |
   | `FRONTEND_REVALIDATE_URL` | `https://example.com/api/revalidate` |
   | `REVALIDATE_SECRET` | long random string, same as the frontend |
   | `QUEUE_CONNECTION` | `database` |
   | `MEDIA_AVIF` | `true` (set `false` if the server's GD lacks AVIF or CPU is tight) |

4. Keep a queue worker running (systemd, Supervisor or the host's worker feature):

   ```sh
   php artisan queue:work --timeout=600 --tries=3
   ```

   It generates the image variants and sends the revalidation webhook. Restart it after each deploy (`php artisan queue:restart`).

5. Storage: originals are kept privately in `storage/app/private/originals` and are never served; public WebP/AVIF variants (without EXIF/GPS) live in `storage/app/public`, served at `/storage`. Back up the database and both folders.

### Frontend

1. Environment (build time and run time):

   | Key | Value |
   |---|---|
   | `API_URL` | backend API as seen from the Next.js server, e.g. `https://api.example.com/api/v1` (an internal address works) |
   | `NEXT_PUBLIC_API_URL` | public backend API URL |
   | `NEXT_PUBLIC_SITE_URL` | `https://example.com` (metadata, sitemap, robots) |
   | `REVALIDATE_SECRET` | same as the backend |
   | `SITE_NAME` | fallback name if the API is briefly unreachable |

2. Build and run (the backend must be reachable during the build, pages are prerendered from it):

   ```sh
   cd frontend
   npm ci
   npm run build
   npm start          # port 3000; run it under systemd/pm2 or any Node host
   ```

3. Content updates arrive through `POST /api/revalidate` (called by the backend's queue). The page cache lives on the server's disk, so run a single instance (or share the cache) for the webhook to reach every copy. Builds reuse `.next/cache`; delete `.next/cache/fetch-cache` first if a fresh build must not reuse data fetched by the previous one.
4. `/media/*` is proxied to the backend's `/storage/*` so the WebGL ledger preview gets same-origin textures.

## Map data

`frontend/public/geo/indonesia-admin1.topo.json` (about 130 KB) is Natural Earth 10m admin-1, filtered to Indonesia and simplified. To rebuild it:

```sh
curl -L -o ne_10m_admin_1.geojson https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_1_states_provinces.geojson

npx mapshaper@0.6 ne_10m_admin_1.geojson -filter 'adm0_a3 === "IDN"' -filter-fields iso_3166_2,name -rename-layers provinces -simplify 45% keep-shapes -o format=topojson quantization=1e5 frontend/public/geo/indonesia-admin1.topo.json
```

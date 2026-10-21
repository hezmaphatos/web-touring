# Logbook

A personal motorcycle touring journal. Two apps in one repo:

```
backend/    Laravel 13 (public JSON API + Filament admin at /admin)
frontend/   Next.js (public site)
```

Decisions that deviate from or interpret the spec are listed in `DECISIONS.md`.

## Requirements

- PHP 8.3+ with the extensions `gd` (WebP; AVIF optional), `intl`, `exif`, `fileinfo`, `mbstring`, `pdo_mysql` (or `pdo_sqlite`), `zip`
- Composer 2
- Node.js 20.9+ and npm
- MySQL 8 (or MariaDB 10.6+). SQLite works for a quick local run.

On the development machine PHP 8.4 lives at `C:\Users\natan\tools\php84`. Put it first on `PATH` (or call it by full path) before running the commands below.

## Run locally

Backend (terminal 1):

```sh
cd backend
composer setup            # install, copy .env, key, migrate, storage:link
php artisan serve         # http://localhost:8000
```

Fill `backend/.env` before `composer setup` if you use MySQL (`DB_*`), and set `REVALIDATE_SECRET` to a long random string.

Then, still in `backend/`:

```sh
php artisan db:seed           # placeholder trips and settings (safe to re-run)
php artisan app:create-admin  # creates the admin for ADMIN_EMAIL, asks for a password
php artisan queue:work --timeout=600   # terminal 3: image variants and frontend revalidation
```

The admin panel is at http://localhost:8000/admin. Uploaded photos show up on the site once the queue worker has generated their variants (AVIF encoding takes a few seconds per photo).

Frontend (terminal 2):

```sh
cd frontend
npm install
cp .env.example .env.local   # set REVALIDATE_SECRET to the same value as the backend
npm run dev                  # http://localhost:3000
```

## Checks

```sh
cd backend && composer lint && composer test
cd frontend && npm run lint && npm run typecheck && npm run build
```

## Map data

`frontend/public/geo/indonesia-admin1.topo.json` (about 130 KB) is Natural Earth 10m admin-1, filtered to Indonesia and simplified. To rebuild it:

```sh
curl -L -o ne_10m_admin_1.geojson https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_1_states_provinces.geojson

npx mapshaper@0.6 ne_10m_admin_1.geojson -filter 'adm0_a3 === "IDN"' -filter-fields iso_3166_2,name -rename-layers provinces -simplify 45% keep-shapes -o format=topojson quantization=1e5 frontend/public/geo/indonesia-admin1.topo.json
```

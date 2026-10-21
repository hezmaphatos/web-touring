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

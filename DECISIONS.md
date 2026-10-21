# Decisions

One line each: decision, reason.

- Laravel 13 on PHP 8.4 (portable build at `C:\Users\natan\tools\php84`), not the XAMPP PHP 8.2: the spec asks for the latest stable Laravel and PHP 8.3+, and Laravel 13 requires PHP 8.3.
- Local development and tests use SQLite; `.env.example` defaults to MySQL: the XAMPP MariaDB on the dev machine does not start (InnoDB redo log error) and holds unrelated databases, so it was left untouched. Code stays driver-agnostic.
- Removed Laravel's Vite/Tailwind scaffold and the Boost `AGENTS.md`/`CLAUDE.md` from `backend`: the backend serves only the API and Filament (which ships its own assets), and the spec does not use Boost.
- No `composer dev` script: Laravel 13's `artisan dev` needs Node tooling in the backend; the README runs `artisan serve` and `queue:work` in two terminals instead.
- Added `NEXT_PUBLIC_SITE_URL` to the frontend env: metadata, sitemap and robots need the public origin.
- Frontend formatting uses Prettier with `eslint-config-prettier`; backend formatting uses Pint (`composer lint` / `composer format`).
- Two services beyond the spec list: `MediaService` (image variants and payloads) and `RevalidationService` (API cache + frontend revalidation); both are needed by the spec's media and caching rules.
- Undated published trips are numbered after dated ones, in creation order: the seeded trips keep the listed order until real dates are entered.
- API cache uses one version counter: any content change bumps it and invalidates every cached response. Simple and safe for a single-author site.
- API throttle is 300 requests/minute per IP: `next build` fetches every page from one server IP.
- Image variants: WebP plus AVIF (when GD supports it, `MEDIA_AVIF`) at 480/800/1200/1600/2400, never upscaled; duplicate widths are dropped from `srcset`; the API adds `avif_srcset` next to the spec's fields.
- Variant files are named after the conversion (`webp-800.webp`) so original file names (often a timestamp) never become public; originals live on the private `originals` disk.
- Photos whose variants are not generated yet are left out of the API, and a cover is `null`, until the queue worker finishes.
- Added the setting key `portrait_photo`: the about page needs a portrait and the spec's key list has none.
- Settings photos are processed outside the media library (the settings table has string keys): variants plus a `meta.json` payload go to `public/site/<name>/`.
- Planned trips return 404 on `/trips/{slug}`; they appear only in `/map` and `/next-rides`.
- Child tables (stops, photos, videos, garage items) have no timestamps: the spec lists timestamps only for trips.
- Days on the road: inclusive date range; a missing end date counts as one day; undated trips add none. Provinces are counted case- and whitespace-insensitively.
- Parameterless GET endpoints use single-action controllers without Form Requests (nothing to validate); the slug is constrained by the route pattern.
- Seeded stops carry their province (a geographic fact, needed for the provinces stat). The planned example uses two stops named "Contoh titik awal/akhir".

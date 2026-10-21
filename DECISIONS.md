# Decisions

One line each: decision, reason.

- Laravel 13 on PHP 8.4 (portable build at `C:\Users\natan\tools\php84`), not the XAMPP PHP 8.2: the spec asks for the latest stable Laravel and PHP 8.3+, and Laravel 13 requires PHP 8.3.
- Local development and tests use SQLite; `.env.example` defaults to MySQL: the XAMPP MariaDB on the dev machine does not start (InnoDB redo log error) and holds unrelated databases, so it was left untouched. Code stays driver-agnostic.
- Removed Laravel's Vite/Tailwind scaffold and the Boost `AGENTS.md`/`CLAUDE.md` from `backend`: the backend serves only the API and Filament (which ships its own assets), and the spec does not use Boost.
- No `composer dev` script: Laravel 13's `artisan dev` needs Node tooling in the backend; the README runs `artisan serve` and `queue:work` in two terminals instead.
- Added `NEXT_PUBLIC_SITE_URL` to the frontend env: metadata, sitemap and robots need the public origin.
- Frontend formatting uses Prettier with `eslint-config-prettier`; backend formatting uses Pint (`composer lint` / `composer format`).

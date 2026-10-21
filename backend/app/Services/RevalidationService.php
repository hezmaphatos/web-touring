<?php

namespace App\Services;

use Closure;
use Illuminate\Support\Facades\Cache;

/**
 * API response cache. Every key carries a version number; a content change bumps the
 * version, which invalidates all cached responses at once.
 */
class RevalidationService
{
    private const VERSION_KEY = 'api:version';

    private const TTL_SECONDS = 86400;

    public function remember(string $key, Closure $callback): mixed
    {
        $version = (int) Cache::get(self::VERSION_KEY, 1);

        return Cache::remember("api:{$version}:{$key}", self::TTL_SECONDS, $callback);
    }

    public function contentChanged(string $tag): void
    {
        Cache::forever(self::VERSION_KEY, (int) Cache::get(self::VERSION_KEY, 1) + 1);
    }
}

<?php

namespace App\Services;

use App\Jobs\RevalidateFrontend;
use App\Models\GarageItem;
use App\Models\Setting;
use App\Models\Trip;
use App\Models\TripPhoto;
use App\Models\TripStop;
use App\Models\TripVideo;
use Closure;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

/**
 * API response cache plus frontend revalidation.
 * Every cache key carries a version number; a content change bumps the version,
 * which invalidates all cached responses at once, then the frontend is told to refetch.
 */
class RevalidationService
{
    private const VERSION_KEY = 'api:version';

    private const TTL_SECONDS = 86400;

    /** Seconds to wait before calling the frontend, so a burst of saves lands first. */
    private const DELAY_SECONDS = 3;

    /**
     * Frontend cache tags affected by each model. Trips also change the site totals (odometer).
     */
    private const TAGS = [
        Trip::class => ['trips', 'site'],
        TripStop::class => ['trips', 'site'],
        TripPhoto::class => ['trips', 'site'],
        TripVideo::class => ['trips', 'site'],
        GarageItem::class => ['garage'],
        Setting::class => ['site'],
    ];

    public function remember(string $key, Closure $callback): mixed
    {
        $version = (int) Cache::get(self::VERSION_KEY, 1);

        return Cache::remember("api:{$version}:{$key}", self::TTL_SECONDS, $callback);
    }

    /**
     * @param  list<string>  $tags
     */
    public function contentChanged(array $tags): void
    {
        Cache::forever(self::VERSION_KEY, (int) Cache::get(self::VERSION_KEY, 1) + 1);

        if (config('logbook.revalidate_url')) {
            RevalidateFrontend::dispatch($tags)->delay(self::DELAY_SECONDS)->afterCommit();
        }
    }

    /**
     * Content change for a model class (or a media owner's morph class).
     */
    public function modelChanged(string $modelClass): void
    {
        $tags = self::TAGS[$modelClass] ?? null;

        if ($tags !== null) {
            $this->contentChanged($tags);
        }
    }

    /**
     * @param  list<string>  $tags
     */
    public function notifyFrontend(array $tags): void
    {
        Http::timeout(15)
            ->withHeaders(['x-revalidate-secret' => (string) config('logbook.revalidate_secret')])
            ->acceptJson()
            ->post((string) config('logbook.revalidate_url'), ['tags' => $tags])
            ->throw();
    }
}

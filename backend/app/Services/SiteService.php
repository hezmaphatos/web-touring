<?php

namespace App\Services;

use App\Jobs\ProcessSettingPhoto;
use App\Models\Setting;

class SiteService
{
    public function __construct(
        private StatsService $stats,
        private MediaService $media,
        private MarkdownService $markdown,
        private RevalidationService $cache,
    ) {}

    public function site(): array
    {
        return $this->cache->remember('site', function () {
            $settings = $this->settings();
            $totals = $this->stats->totals();
            $siteName = $this->filled($settings['site_name']) ?? config('logbook.site_name');
            $bikeName = $this->filled($settings['bike_name']);

            return [
                'site_name' => $siteName,
                'about_html' => $this->markdown->toHtml($settings['about_markdown']),
                'bike' => [
                    'name' => $bikeName,
                    'photo' => $this->media->storedImage($settings['bike_photo'], $bikeName ?? $siteName),
                ],
                'portrait' => $this->media->storedImage($settings['portrait_photo'], $siteName),
                'links' => [
                    'youtube' => $this->filled($settings['youtube_url']),
                    'instagram' => $this->filled($settings['instagram_url']),
                ],
                'total_km' => $totals['total_km'],
                'counts' => [
                    'trips' => $totals['trips'],
                    'photos' => $totals['photos'],
                    'videos' => $totals['videos'],
                ],
            ];
        });
    }

    /**
     * All setting keys with their stored value (null when unset).
     *
     * @return array<string, string|null>
     */
    public function settings(): array
    {
        $rows = Setting::query()->whereIn('key', Setting::KEYS)->get()->toArray();
        $settings = array_fill_keys(Setting::KEYS, null);

        foreach ($rows as $row) {
            $settings[$row['key']] = $row['value'];
        }

        return $settings;
    }

    /**
     * Saves every setting key. A replaced photo has its old files removed and new variants queued.
     *
     * @param  array<string, mixed>  $data
     */
    public function saveSettings(array $data): void
    {
        $current = $this->settings();

        foreach (Setting::KEYS as $key) {
            $value = $data[$key] ?? null;
            $value = is_string($value) ? $this->filled($value) : null;

            Setting::query()->updateOrCreate(['key' => $key], ['value' => $value]);

            if (! in_array($key, Setting::PHOTO_KEYS, true) || $value === $current[$key]) {
                continue;
            }

            if ($current[$key] !== null) {
                $this->media->deleteStoredImage($current[$key]);
            }

            if ($value !== null) {
                ProcessSettingPhoto::dispatch($value);
            }
        }
    }

    private function filled(?string $value): ?string
    {
        return $value === null || trim($value) === '' ? null : trim($value);
    }
}

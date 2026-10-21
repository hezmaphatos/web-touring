<?php

namespace App\Services;

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

    private function filled(?string $value): ?string
    {
        return $value === null || trim($value) === '' ? null : trim($value);
    }
}

<?php

namespace App\Services;

use App\Models\GarageItem;

class GarageService
{
    public function __construct(
        private MediaService $media,
        private MarkdownService $markdown,
        private RevalidationService $cache,
    ) {}

    public function items(): array
    {
        return $this->cache->remember('garage', function () {
            $items = GarageItem::query()->with('media')->orderBy('position')->orderBy('id')->get()->toArray();
            $result = [];

            foreach ($items as $item) {
                $hasHotspot = $item['hotspot_x'] !== null && $item['hotspot_y'] !== null;

                $result[] = [
                    'id' => $item['id'],
                    'name' => $item['name'],
                    'category' => $item['category'],
                    'description_html' => $this->markdown->toHtml($item['description']),
                    'installed_at' => $item['installed_at'],
                    'hotspot' => $hasHotspot
                        ? ['x' => (float) $item['hotspot_x'], 'y' => (float) $item['hotspot_y']]
                        : null,
                    'photo' => $this->media->image($this->media->first($item['media'], 'photo'), $item['name']),
                ];
            }

            return $result;
        });
    }
}

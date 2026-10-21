<?php

namespace App\Services;

use App\Models\Trip;
use App\Models\TripStop;
use Illuminate\Database\Eloquent\Builder;

class TripService
{
    public function __construct(
        private MediaService $media,
        private MarkdownService $markdown,
        private RevalidationService $cache,
        private CoordinateService $coordinates,
        private YoutubeService $youtube,
    ) {}

    /**
     * Published trips in chronological order. The trip number is the position in this list.
     */
    public function published(): array
    {
        return $this->cache->remember('trips', function () {
            $trips = $this->publishedQuery()->with(['media', 'stops'])->get()->toArray();
            $result = [];

            foreach ($trips as $index => $trip) {
                $result[] = $this->listItem($trip, $index + 1);
            }

            return $result;
        });
    }

    /**
     * Full published trip with stops, photos, videos and its neighbours, or null.
     */
    public function findPublished(string $slug): ?array
    {
        return $this->cache->remember("trip:{$slug}", function () use ($slug) {
            $order = $this->publishedQuery()->select(['id', 'slug', 'title'])->get()->toArray();
            $index = null;

            foreach ($order as $position => $row) {
                if ($row['slug'] === $slug) {
                    $index = $position;
                    break;
                }
            }

            if ($index === null) {
                return null;
            }

            $trip = Trip::query()
                ->with(['media', 'stops', 'photos.media', 'videos'])
                ->findOrFail($order[$index]['id'])
                ->toArray();

            $prev = $order[$index - 1] ?? null;
            $next = $order[$index + 1] ?? null;

            return $this->fullTrip(
                $trip,
                $index + 1,
                $prev === null ? null : ['slug' => $prev['slug'], 'title' => $prev['title']],
                $next === null ? null : ['slug' => $next['slug'], 'title' => $next['title']],
            );
        });
    }

    /**
     * Planned trips for the next-ride page.
     */
    public function planned(): array
    {
        return $this->cache->remember('next-rides', function () {
            $trips = $this->plannedQuery()->with(['media', 'stops'])->get()->toArray();
            $result = [];

            foreach ($trips as $trip) {
                $item = $this->listItem($trip, null);
                $item['planned_for'] = $trip['planned_for'];
                $item['note_html'] = $this->markdown->toHtml($trip['description']);
                $item['route_geojson'] = $trip['route_geojson'];
                $result[] = $item;
            }

            return $result;
        });
    }

    /**
     * Stops of one trip as select options for the admin (id => name).
     *
     * @return array<int, string>
     */
    public function stopOptions(?int $tripId): array
    {
        if ($tripId === null) {
            return [];
        }

        $stops = TripStop::query()
            ->where('trip_id', $tripId)
            ->orderBy('position')
            ->get(['id', 'name'])
            ->toArray();

        $options = [];

        foreach ($stops as $stop) {
            $options[$stop['id']] = $stop['name'];
        }

        return $options;
    }

    /**
     * Admin form state for a stop: lat/lng become one pasteable "lat, lng" field.
     */
    public function stopFormData(array $data): array
    {
        $data['coordinates'] = $this->coordinates->format($data['lat'] ?? null, $data['lng'] ?? null);

        return $data;
    }

    /**
     * Stop data to store: the "lat, lng" field is split into columns.
     */
    public function stopSaveData(array $data): array
    {
        $parsed = $this->coordinates->parse($data['coordinates'] ?? null);
        unset($data['coordinates']);

        if ($parsed !== null) {
            $data['lat'] = $parsed['lat'];
            $data['lng'] = $parsed['lng'];
        }

        return $data;
    }

    /**
     * Video data to store: the ID is always parsed from the link.
     */
    public function videoSaveData(array $data): array
    {
        $data['youtube_id'] = $this->youtube->parseId($data['youtube_url'] ?? null);

        return $data;
    }

    public function publish(int $tripId): void
    {
        Trip::query()->findOrFail($tripId)->update(['status' => 'published']);
    }

    /**
     * Published trips ordered for numbering. Undated trips follow dated ones,
     * in creation order, until real dates are entered.
     */
    public function publishedQuery(): Builder
    {
        return Trip::query()
            ->where('status', 'published')
            ->orderByRaw('started_at IS NULL')
            ->orderBy('started_at')
            ->orderBy('id');
    }

    public function plannedQuery(): Builder
    {
        return Trip::query()->where('status', 'planned')->orderBy('id');
    }

    /**
     * Compact trip shape used by the ledger, home and map.
     */
    public function listItem(array $trip, ?int $number): array
    {
        $stops = [];

        foreach ($trip['stops'] as $stop) {
            $stops[] = [
                'name' => $stop['name'],
                'lat' => (float) $stop['lat'],
                'lng' => (float) $stop['lng'],
            ];
        }

        return [
            'number' => $number,
            'slug' => $trip['slug'],
            'title' => $trip['title'],
            'summary' => $trip['summary'],
            'type' => $trip['type'],
            'status' => $trip['status'],
            'started_at' => $trip['started_at'],
            'ended_at' => $trip['ended_at'],
            'year' => $this->year($trip['started_at']),
            'distance_km' => $this->decimal($trip['distance_km']),
            'max_elevation_m' => $trip['max_elevation_m'],
            'cover' => $this->media->image($this->media->first($trip['media'], 'cover'), $trip['title']),
            'stops' => $stops,
        ];
    }

    private function fullTrip(array $trip, int $number, ?array $prev, ?array $next): array
    {
        $stops = [];

        foreach ($trip['stops'] as $stop) {
            $stops[] = [
                'id' => $stop['id'],
                'name' => $stop['name'],
                'province' => $stop['province'],
                'lat' => (float) $stop['lat'],
                'lng' => (float) $stop['lng'],
                'km_marker' => $this->decimal($stop['km_marker']),
                'note_html' => $this->markdown->toHtml($stop['note']),
            ];
        }

        $photos = [];

        foreach ($trip['photos'] as $photo) {
            $alt = $photo['caption'] !== null && $photo['caption'] !== '' ? $photo['caption'] : $trip['title'];
            $image = $this->media->image($this->media->first($photo['media'], 'image'), $alt);

            // Photos still waiting for their variants are left out until the queue finishes.
            if ($image === null) {
                continue;
            }

            $photos[] = [
                'id' => $photo['id'],
                'stop_id' => $photo['stop_id'],
                'caption' => $photo['caption'],
                'image' => $image,
            ];
        }

        $videos = [];

        foreach ($trip['videos'] as $video) {
            $videos[] = [
                'id' => $video['id'],
                'stop_id' => $video['stop_id'],
                'youtube_id' => $video['youtube_id'],
                'title' => $video['title'],
            ];
        }

        return [
            'slug' => $trip['slug'],
            'number' => $number,
            'title' => $trip['title'],
            'summary' => $trip['summary'],
            'type' => $trip['type'],
            'status' => $trip['status'],
            'started_at' => $trip['started_at'],
            'ended_at' => $trip['ended_at'],
            'year' => $this->year($trip['started_at']),
            'distance_km' => $this->decimal($trip['distance_km']),
            'max_elevation_m' => $trip['max_elevation_m'],
            'pull_quote' => $trip['pull_quote'],
            'description_html' => $this->markdown->toHtml($trip['description']),
            'cover' => $this->media->image($this->media->first($trip['media'], 'cover'), $trip['title']),
            'stops' => $stops,
            'photos' => $photos,
            'videos' => $videos,
            'route_geojson' => $trip['route_geojson'],
            'prev' => $prev,
            'next' => $next,
        ];
    }

    private function year(?string $date): ?int
    {
        return $date === null ? null : (int) substr($date, 0, 4);
    }

    private function decimal(string|float|int|null $value): ?float
    {
        return $value === null ? null : (float) $value;
    }
}

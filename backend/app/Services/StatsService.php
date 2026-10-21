<?php

namespace App\Services;

use App\Models\Trip;
use App\Models\TripPhoto;
use App\Models\TripStop;
use App\Models\TripVideo;
use Illuminate\Support\Facades\DB;

/**
 * Cumulative numbers over published trips, computed with aggregate queries.
 */
class StatsService
{
    public function __construct(private RevalidationService $cache) {}

    public function stats(): array
    {
        return $this->cache->remember('stats', function () {
            return $this->totals() + ['km_per_year' => $this->kmPerYear()];
        });
    }

    /**
     * @return array{total_km: float, trips: int, days_on_road: int, highest_point_m: int|null, provinces_visited: int, photos: int, videos: int}
     */
    public function totals(): array
    {
        $days = $this->daysExpression();

        $trips = Trip::query()
            ->where('status', 'published')
            ->selectRaw('COUNT(*) as trips')
            ->selectRaw('COALESCE(SUM(distance_km), 0) as total_km')
            ->selectRaw('MAX(max_elevation_m) as highest_point_m')
            ->selectRaw("COALESCE(SUM(CASE WHEN started_at IS NULL THEN 0 ELSE {$days} + 1 END), 0) as days_on_road")
            ->toBase()
            ->first();
        $trips = (array) $trips;

        $provinces = (array) TripStop::query()
            ->join('trips', 'trips.id', '=', 'trip_stops.trip_id')
            ->where('trips.status', 'published')
            ->whereNotNull('trip_stops.province')
            ->where('trip_stops.province', '<>', '')
            ->selectRaw('COUNT(DISTINCT LOWER(TRIM(trip_stops.province))) as provinces')
            ->toBase()
            ->first();

        $photos = TripPhoto::query()
            ->join('trips', 'trips.id', '=', 'trip_photos.trip_id')
            ->where('trips.status', 'published')
            ->count();

        $videos = TripVideo::query()
            ->join('trips', 'trips.id', '=', 'trip_videos.trip_id')
            ->where('trips.status', 'published')
            ->count();

        return [
            'total_km' => round((float) $trips['total_km'], 1),
            'trips' => (int) $trips['trips'],
            'days_on_road' => (int) $trips['days_on_road'],
            'highest_point_m' => $trips['highest_point_m'] === null ? null : (int) $trips['highest_point_m'],
            'provinces_visited' => (int) $provinces['provinces'],
            'photos' => $photos,
            'videos' => $videos,
        ];
    }

    /**
     * @return list<array{year: int, km: float, trips: int}>
     */
    public function kmPerYear(): array
    {
        $year = $this->yearExpression();

        $rows = Trip::query()
            ->where('status', 'published')
            ->whereNotNull('started_at')
            ->selectRaw("{$year} as year")
            ->selectRaw('COALESCE(SUM(distance_km), 0) as km')
            ->selectRaw('COUNT(*) as trips')
            ->groupByRaw($year)
            ->orderByRaw($year)
            ->toBase()
            ->get()
            ->all();

        $result = [];

        foreach ($rows as $row) {
            $row = (array) $row;
            $result[] = [
                'year' => (int) $row['year'],
                'km' => round((float) $row['km'], 1),
                'trips' => (int) $row['trips'],
            ];
        }

        return $result;
    }

    /** Whole days between start and end (end falls back to start). */
    private function daysExpression(): string
    {
        return match (DB::connection()->getDriverName()) {
            'sqlite' => 'CAST(julianday(COALESCE(ended_at, started_at)) - julianday(started_at) AS INTEGER)',
            'pgsql' => '(COALESCE(ended_at, started_at) - started_at)',
            default => 'DATEDIFF(COALESCE(ended_at, started_at), started_at)',
        };
    }

    private function yearExpression(): string
    {
        return match (DB::connection()->getDriverName()) {
            'sqlite' => "CAST(strftime('%Y', started_at) AS INTEGER)",
            'pgsql' => 'CAST(EXTRACT(YEAR FROM started_at) AS INTEGER)',
            default => 'YEAR(started_at)',
        };
    }
}

<?php

namespace App\Services;

class MapService
{
    public function __construct(
        private TripService $trips,
        private RevalidationService $cache,
    ) {}

    /**
     * Published trips (numbered, chronological) followed by planned trips, with route data.
     */
    public function map(): array
    {
        return $this->cache->remember('map', function () {
            $published = $this->trips->publishedQuery()->with(['media', 'stops'])->get()->toArray();
            $planned = $this->trips->plannedQuery()->with(['media', 'stops'])->get()->toArray();
            $result = [];

            foreach ($published as $index => $trip) {
                $item = $this->trips->listItem($trip, $index + 1);
                $item['route_geojson'] = $trip['route_geojson'];
                $item['planned_for'] = null;
                $result[] = $item;
            }

            foreach ($planned as $trip) {
                $item = $this->trips->listItem($trip, null);
                $item['route_geojson'] = $trip['route_geojson'];
                $item['planned_for'] = $trip['planned_for'];
                $result[] = $item;
            }

            return $result;
        });
    }
}

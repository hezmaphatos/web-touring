<?php

namespace Tests\Unit;

use App\Models\Trip;
use App\Models\TripPhoto;
use App\Models\TripStop;
use App\Models\TripVideo;
use App\Services\StatsService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StatsServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_empty_database_gives_zeroes(): void
    {
        $this->assertSame([
            'total_km' => 0.0,
            'trips' => 0,
            'days_on_road' => 0,
            'highest_point_m' => null,
            'provinces_visited' => 0,
            'photos' => 0,
            'videos' => 0,
            'km_per_year' => [],
        ], app(StatsService::class)->stats());
    }

    public function test_aggregates_only_published_trips(): void
    {
        $dieng = Trip::factory()->dated('2025-01-10', '2025-01-12')->create([
            'distance_km' => 612.4, 'max_elevation_m' => 2093,
        ]);
        $telomoyo = Trip::factory()->dated('2025-06-01')->create([
            'distance_km' => 488, 'max_elevation_m' => 1894,
        ]);
        $sawarna = Trip::factory()->dated('2026-03-30', '2026-04-02')->create([
            'distance_km' => 300.1,
        ]);
        Trip::factory()->create(['distance_km' => 50]); // published, undated
        $draft = Trip::factory()->draft()->dated('2024-01-01', '2024-01-30')->create([
            'distance_km' => 9999, 'max_elevation_m' => 9000,
        ]);
        Trip::factory()->planned()->create(['distance_km' => 777]);

        TripStop::factory()->for($dieng)->create(['province' => 'Jawa Tengah']);
        TripStop::factory()->for($telomoyo)->create(['province' => 'jawa tengah ']);
        TripStop::factory()->for($sawarna)->create(['province' => 'Banten']);
        TripStop::factory()->for($sawarna)->create(['province' => null]);
        TripStop::factory()->for($draft)->create(['province' => 'Papua']);

        TripPhoto::factory()->count(3)->for($dieng)->create();
        TripPhoto::factory()->for($draft)->create();
        TripVideo::factory()->for($telomoyo)->create();
        TripVideo::factory()->for($draft)->create();

        $stats = app(StatsService::class)->stats();

        $this->assertSame(1450.5, $stats['total_km']);
        $this->assertSame(4, $stats['trips']);
        // 3 (10-12 Jan) + 1 (single day) + 4 (30 Mar - 2 Apr); undated trips count no days.
        $this->assertSame(8, $stats['days_on_road']);
        $this->assertSame(2093, $stats['highest_point_m']);
        $this->assertSame(2, $stats['provinces_visited']);
        $this->assertSame(3, $stats['photos']);
        $this->assertSame(1, $stats['videos']);
        $this->assertSame([
            ['year' => 2025, 'km' => 1100.4, 'trips' => 2],
            ['year' => 2026, 'km' => 300.1, 'trips' => 1],
        ], $stats['km_per_year']);
    }
}

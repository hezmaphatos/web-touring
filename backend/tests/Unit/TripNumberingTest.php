<?php

namespace Tests\Unit;

use App\Models\Trip;
use App\Services\TripService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TripNumberingTest extends TestCase
{
    use RefreshDatabase;

    public function test_numbers_follow_start_date_among_published_trips(): void
    {
        Trip::factory()->dated('2025-06-01')->create(['slug' => 'telomoyo']);
        Trip::factory()->create(['slug' => 'undated-first-created']);
        Trip::factory()->dated('2024-02-01')->create(['slug' => 'sawarna']);
        Trip::factory()->draft()->dated('2023-01-01')->create(['slug' => 'draft']);
        Trip::factory()->planned()->create(['slug' => 'planned']);
        Trip::factory()->dated('2025-01-10')->create(['slug' => 'dieng']);
        Trip::factory()->create(['slug' => 'undated-second-created']);

        $numbers = [];

        foreach (app(TripService::class)->published() as $trip) {
            $numbers[$trip['slug']] = $trip['number'];
        }

        $this->assertSame([
            'sawarna' => 1,
            'dieng' => 2,
            'telomoyo' => 3,
            'undated-first-created' => 4,
            'undated-second-created' => 5,
        ], $numbers);
    }

    public function test_trip_detail_uses_the_same_number_and_neighbours(): void
    {
        Trip::factory()->dated('2025-06-01')->create(['slug' => 'telomoyo', 'title' => 'Telomoyo']);
        Trip::factory()->dated('2024-02-01')->create(['slug' => 'sawarna', 'title' => 'Sawarna']);
        Trip::factory()->draft()->dated('2025-01-01')->create(['slug' => 'draft']);
        Trip::factory()->dated('2025-01-10')->create(['slug' => 'dieng', 'title' => 'Dieng']);

        $service = app(TripService::class);
        $dieng = $service->findPublished('dieng');

        $this->assertSame(2, $dieng['number']);
        $this->assertSame(['slug' => 'sawarna', 'title' => 'Sawarna'], $dieng['prev']);
        $this->assertSame(['slug' => 'telomoyo', 'title' => 'Telomoyo'], $dieng['next']);
        $this->assertNull($service->findPublished('sawarna')['prev']);
        $this->assertNull($service->findPublished('telomoyo')['next']);
    }
}

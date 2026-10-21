<?php

namespace Tests\Unit;

use App\Models\Trip;
use App\Services\TripService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TripAdminDataTest extends TestCase
{
    use RefreshDatabase;

    public function test_stop_coordinates_round_trip_through_one_field(): void
    {
        $service = app(TripService::class);

        $form = $service->stopFormData(['name' => 'Dieng', 'lat' => '-7.2000000', 'lng' => '109.9100000']);
        $this->assertSame('-7.2, 109.91', $form['coordinates']);

        $saved = $service->stopSaveData(['name' => 'Dieng', 'coordinates' => '-7.208123, 109.906543']);
        $this->assertSame(['name' => 'Dieng', 'lat' => -7.208123, 'lng' => 109.906543], $saved);
    }

    public function test_video_id_is_parsed_from_the_link(): void
    {
        $saved = app(TripService::class)->videoSaveData(['youtube_url' => 'https://youtu.be/dQw4w9WgXcQ?si=x']);

        $this->assertSame('dQw4w9WgXcQ', $saved['youtube_id']);
    }

    public function test_publish_sets_the_status(): void
    {
        $trip = Trip::factory()->draft()->create();

        app(TripService::class)->publish($trip['id']);

        $this->assertSame('published', $trip->fresh()['status']);
    }
}

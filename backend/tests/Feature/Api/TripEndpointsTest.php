<?php

namespace Tests\Feature\Api;

use App\Models\Trip;
use App\Models\TripPhoto;
use App\Models\TripStop;
use App\Models\TripVideo;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class TripEndpointsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('originals');
        Storage::fake('public');
    }

    public function test_index_lists_only_published_trips_in_order(): void
    {
        Trip::factory()->dated('2025-06-01')->create(['slug' => 'telomoyo']);
        Trip::factory()->dated('2024-02-01')->create(['slug' => 'sawarna']);
        Trip::factory()->draft()->create(['slug' => 'secret-draft']);
        Trip::factory()->planned()->create(['slug' => 'someday']);

        $response = $this->getJson('/api/v1/trips')->assertOk();

        $this->assertSame(['sawarna', 'telomoyo'], array_column($response->json(), 'slug'));
        $this->assertSame([1, 2], array_column($response->json(), 'number'));
        $response->assertJsonStructure([[
            'number', 'slug', 'title', 'summary', 'type', 'status', 'started_at', 'ended_at', 'year',
            'distance_km', 'max_elevation_m', 'cover', 'stops',
        ]]);
        $this->assertStringNotContainsString('secret-draft', $response->getContent());
    }

    public function test_show_returns_the_full_trip(): void
    {
        $trip = Trip::factory()->dated('2025-01-10', '2025-01-12')->create([
            'slug' => 'dieng',
            'title' => 'Dieng',
            'type' => 'highland',
            'distance_km' => 612,
            'max_elevation_m' => 2093,
            'description' => "Hari pertama.\n\n<script>alert(1)</script>",
            'pull_quote' => 'Kabutnya turun cepat.',
        ]);
        $stop = TripStop::factory()->for($trip)->create([
            'name' => 'Wonosobo', 'lat' => -7.3605, 'lng' => 109.9006, 'km_marker' => 410.5, 'note' => '**Istirahat**',
        ]);
        TripVideo::factory()->for($trip)->create(['stop_id' => $stop['id'], 'youtube_id' => 'dQw4w9WgXcQ']);

        $response = $this->getJson('/api/v1/trips/dieng')->assertOk();

        $response->assertJsonPath('number', 1)
            ->assertJsonPath('title', 'Dieng')
            ->assertJsonPath('distance_km', 612)
            ->assertJsonPath('started_at', '2025-01-10')
            ->assertJsonPath('stops.0.name', 'Wonosobo')
            ->assertJsonPath('stops.0.km_marker', 410.5)
            ->assertJsonPath('stops.0.note_html', '<p><strong>Istirahat</strong></p>')
            ->assertJsonPath('videos.0.youtube_id', 'dQw4w9WgXcQ')
            ->assertJsonPath('videos.0.stop_id', $stop['id'])
            ->assertJsonPath('prev', null)
            ->assertJsonPath('next', null);
        $this->assertStringNotContainsString('<script>', $response->json('description_html'));
    }

    public function test_draft_and_planned_trips_are_404(): void
    {
        Trip::factory()->draft()->create(['slug' => 'secret-draft']);
        Trip::factory()->planned()->create(['slug' => 'someday']);

        $this->getJson('/api/v1/trips/secret-draft')->assertNotFound();
        $this->getJson('/api/v1/trips/someday')->assertNotFound();
        $this->getJson('/api/v1/trips/does-not-exist')->assertNotFound();
    }

    public function test_cover_and_photos_expose_variants_with_dimensions(): void
    {
        $trip = Trip::factory()->create(['slug' => 'dieng', 'title' => 'Dieng']);
        $trip->addMedia(UploadedFile::fake()->image('IMG_20250110_0800.jpg', 1000, 600))->toMediaCollection('cover');
        $photo = TripPhoto::factory()->for($trip)->create(['caption' => null]);
        $photo->addMedia(UploadedFile::fake()->image('portrait.jpg', 600, 900))->toMediaCollection('image');

        $response = $this->getJson('/api/v1/trips/dieng')->assertOk();

        $cover = $response->json('cover');
        $this->assertSame(1000, $cover['width']);
        $this->assertSame(600, $cover['height']);
        $this->assertSame('Dieng', $cover['alt']);
        $this->assertStringStartsWith('data:image/webp;base64,', $cover['placeholder']);
        $this->assertStringEndsWith('webp-800.webp 800w, '.$this->urlFor($cover['srcset'], 'webp-1200.webp').' 1000w', $cover['srcset']);
        $this->assertStringContainsString('webp-480.webp 480w', $cover['srcset']);
        $this->assertStringNotContainsString('IMG_20250110', $response->getContent());

        $response->assertJsonPath('photos.0.image.width', 600)
            ->assertJsonPath('photos.0.image.height', 900)
            ->assertJsonPath('photos.0.image.alt', 'Dieng');
    }

    private function urlFor(string $srcset, string $file): string
    {
        preg_match('#(\S+/'.preg_quote($file, '#').')#', $srcset, $matches);

        return $matches[1];
    }
}

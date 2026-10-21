<?php

namespace Tests\Feature\Admin;

use App\Filament\Resources\Trips\Pages\CreateTrip;
use App\Filament\Resources\Trips\Pages\EditTrip;
use App\Models\Trip;
use App\Models\TripStop;
use App\Models\User;
use Filament\Forms\Components\Repeater;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Livewire\Livewire;
use Tests\TestCase;

class TripAdminTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('originals');
        Storage::fake('public');
        Storage::fake('local');
        config(['logbook.admin_email' => 'aku@example.com']);
        $this->actingAs(User::factory()->create(['email' => 'aku@example.com']));
    }

    public function test_admin_pages_render(): void
    {
        $trip = Trip::factory()->draft()->create();

        $this->get('/admin/trips')->assertOk()->assertSee($trip['title']);
        $this->get('/admin/trips/create')->assertOk()->assertSee('Titik singgah');
        $this->get("/admin/trips/{$trip['id']}/edit")->assertOk()->assertSee('Publikasikan');
        $this->get('/admin/garage-items')->assertOk();
        $this->get('/admin/garage-items/create')->assertOk();
        $this->get('/admin/pengaturan')->assertOk()->assertSee('Simpan');
    }

    public function test_creating_a_trip_in_admin_reaches_the_api(): void
    {
        $undoRepeaterFake = Repeater::fake();

        Livewire::test(CreateTrip::class)
            ->fillForm([
                'title' => 'Dieng',
                'slug' => 'dieng',
                'type' => 'highland',
                'status' => 'published',
                'started_at' => '2025-01-10',
                'ended_at' => '2025-01-12',
                'distance_km' => 612.5,
                'max_elevation_m' => 2093,
                'summary' => 'Naik ke dataran tinggi.',
                'cover' => [UploadedFile::fake()->image('cover.jpg', 1600, 1000)],
                'stops' => [
                    ['name' => 'Wonosobo', 'province' => 'Jawa Tengah', 'coordinates' => '-7.3605, 109.9006', 'km_marker' => 410],
                    ['name' => 'Dieng', 'province' => 'Jawa Tengah', 'coordinates' => '-7.2, 109.91', 'km_marker' => 440, 'note' => 'Dingin.'],
                ],
                'photos' => [
                    ['image' => [UploadedFile::fake()->image('kabut.jpg', 1200, 800)], 'caption' => 'Kabut pagi di telaga.'],
                ],
                'videos' => [
                    ['youtube_url' => 'https://youtu.be/dQw4w9WgXcQ?si=share', 'title' => 'Tanjakan'],
                ],
            ])
            ->call('create')
            ->assertHasNoFormErrors()
            ->assertNotified('Tersimpan');

        $undoRepeaterFake();

        $response = $this->getJson('/api/v1/trips/dieng')->assertOk();
        $response->assertJsonPath('number', 1)
            ->assertJsonPath('distance_km', 612.5)
            ->assertJsonPath('stops.0.name', 'Wonosobo')
            ->assertJsonPath('stops.0.lat', -7.3605)
            ->assertJsonPath('stops.1.note_html', '<p>Dingin.</p>')
            ->assertJsonPath('videos.0.youtube_id', 'dQw4w9WgXcQ')
            ->assertJsonPath('photos.0.caption', 'Kabut pagi di telaga.')
            ->assertJsonPath('photos.0.image.width', 1200)
            ->assertJsonPath('photos.0.image.alt', 'Kabut pagi di telaga.')
            ->assertJsonPath('cover.width', 1600);

        $this->assertStringContainsString('webp-1200.webp 1200w', $response->json('cover.srcset'));
        // Originals (cover + photo) land on the private disk, nowhere else.
        $this->assertCount(2, Storage::disk('originals')->allFiles());
        $this->assertSame([], array_filter(Storage::disk('local')->allFiles(), fn (string $file) => ! str_starts_with($file, 'livewire-tmp/')));
        $src = parse_url($response->json('cover.src'), PHP_URL_PATH);
        Storage::disk('public')->assertExists(substr($src, strlen('/storage/')));
    }

    public function test_invalid_coordinates_and_youtube_links_are_rejected(): void
    {
        $undoRepeaterFake = Repeater::fake();

        Livewire::test(CreateTrip::class)
            ->fillForm([
                'title' => 'Dieng',
                'slug' => 'dieng',
                'type' => 'highland',
                'status' => 'draft',
                'stops' => [['name' => 'Dieng', 'coordinates' => 'Dieng, Jawa Tengah']],
                'videos' => [['youtube_url' => 'https://vimeo.com/123']],
            ])
            ->call('create')
            ->assertHasFormErrors([
                'stops.0.coordinates',
                'videos.0.youtube_url',
            ]);

        $undoRepeaterFake();
        $this->assertSame(0, Trip::query()->count());
    }

    public function test_publish_action_publishes_a_draft(): void
    {
        $trip = Trip::factory()->draft()->create(['slug' => 'dieng']);
        $stop = TripStop::factory()->for($trip)->create(['lat' => -7.2, 'lng' => 109.91]);

        Livewire::test(EditTrip::class, ['record' => $trip->getKey()])
            ->assertFormSet(["stops.record-{$stop['id']}.coordinates" => '-7.2, 109.91'])
            ->callAction('publish')
            ->assertNotified('Dipublikasikan');

        $this->assertSame('published', $trip->fresh()['status']);
        $this->getJson('/api/v1/trips/dieng')->assertOk();
    }
}

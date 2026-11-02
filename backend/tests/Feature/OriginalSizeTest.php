<?php

namespace Tests\Feature;

use App\Models\Trip;
use App\Services\SiteService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class OriginalSizeTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('originals');
        Storage::fake('public');
    }

    public function test_originals_are_kept_as_uploaded_by_default(): void
    {
        $trip = Trip::factory()->create();
        $media = $trip->addMedia(UploadedFile::fake()->image('a.jpg', 1600, 1000))->toMediaCollection('cover');

        $this->assertSame(1600, getimagesizefromstring(Storage::disk('originals')->get($media->getPathRelativeToRoot()))[0]);
    }

    public function test_large_originals_are_shrunk_before_variants(): void
    {
        config(['logbook.original_max_size' => 800]);
        $trip = Trip::factory()->create(['slug' => 'dieng']);
        $media = $trip->addMedia(UploadedFile::fake()->image('a.jpg', 1600, 1000))->toMediaCollection('cover');

        $stored = getimagesizefromstring(Storage::disk('originals')->get($media->getPathRelativeToRoot()));
        $this->assertSame([800, 500], [$stored[0], $stored[1]]);
        $this->assertSame(Storage::disk('originals')->size($media->getPathRelativeToRoot()), $media->fresh()['size']);
        $this->getJson('/api/v1/trips/dieng')->assertJsonPath('cover.width', 800);
    }

    public function test_settings_photos_are_shrunk_too(): void
    {
        Queue::fake();
        config(['logbook.original_max_size' => 800]);
        $image = UploadedFile::fake()->image('m.jpg', 1000, 2000);
        Storage::disk('originals')->put('settings/motor.jpg', file_get_contents($image->getPathname()));

        app(SiteService::class)->saveSettings(['bike_photo' => 'settings/motor.jpg']);

        $stored = getimagesizefromstring(Storage::disk('originals')->get('settings/motor.jpg'));
        $this->assertSame([400, 800], [$stored[0], $stored[1]]);
    }
}

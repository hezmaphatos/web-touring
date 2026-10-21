<?php

namespace Tests\Feature;

use App\Jobs\ProcessSettingPhoto;
use App\Models\Trip;
use App\Services\MediaService;
use App\Services\RevalidationService;
use App\Services\SiteService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class MediaPrivacyTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('originals');
        Storage::fake('public');
    }

    public function test_public_variants_contain_no_exif_or_gps(): void
    {
        config(['logbook.avif' => true]);
        $jpeg = $this->jpegWithGps(1200, 800);
        $this->assertArrayHasKey('GPSLatitude', exif_read_data($jpeg), 'fixture must carry GPS data');

        $trip = Trip::factory()->create(['slug' => 'dieng']);
        $media = $trip->addMedia($jpeg)->toMediaCollection('cover');

        $files = Storage::disk('public')->allFiles();
        $this->assertNotEmpty($files);
        $this->assertContains("{$media['id']}/conversions/webp-800.webp", $files);

        if (function_exists('imageavif')) {
            $this->assertContains("{$media['id']}/conversions/avif-800.avif", $files);
        }

        foreach ($files as $file) {
            $contents = Storage::disk('public')->get($file);
            $this->assertStringNotContainsString('Exif', $contents, "{$file} carries EXIF");
            $this->assertStringNotContainsString('EXIF', $contents, "{$file} carries an EXIF chunk");
        }

        // The original (with GPS) stays on the private disk only.
        $this->assertCount(1, Storage::disk('originals')->allFiles());
        $this->assertSame(1200, $this->getJson('/api/v1/trips/dieng')->json('cover.width'));
    }

    public function test_settings_photos_are_re_encoded_without_metadata(): void
    {
        Queue::fake();
        $path = 'settings/bike.jpg';
        $jpeg = $this->jpegWithGps(900, 600);
        Storage::disk('originals')->put($path, file_get_contents($jpeg->getPathname()));

        app(SiteService::class)->saveSettings(['bike_name' => 'Yamaha XSR 155', 'bike_photo' => $path]);

        Queue::assertPushed(ProcessSettingPhoto::class, fn (ProcessSettingPhoto $job) => $job->path === $path);
        (new ProcessSettingPhoto($path))->handle(app(MediaService::class), app(RevalidationService::class));

        foreach (Storage::disk('public')->allFiles('site/bike') as $file) {
            $this->assertStringNotContainsString('Exif', Storage::disk('public')->get($file), $file);
        }

        $this->getJson('/api/v1/site')
            ->assertOk()
            ->assertJsonPath('bike.photo.width', 900)
            ->assertJsonPath('bike.photo.height', 600)
            ->assertJsonPath('bike.photo.alt', 'Yamaha XSR 155');
    }

    public function test_replacing_a_settings_photo_removes_the_old_files(): void
    {
        Queue::fake();
        $service = app(SiteService::class);
        Storage::disk('originals')->put('settings/old.jpg', 'x');
        Storage::disk('public')->put('site/old/webp-480.webp', 'x');
        $service->saveSettings(['bike_photo' => 'settings/old.jpg']);

        $service->saveSettings(['bike_photo' => 'settings/new.jpg']);

        Storage::disk('originals')->assertMissing('settings/old.jpg');
        Storage::disk('public')->assertMissing('site/old/webp-480.webp');
    }

    /**
     * A real JPEG with an APP1 Exif segment holding a GPS latitude (6° 59' 24" S).
     */
    private function jpegWithGps(int $width, int $height): UploadedFile
    {
        $file = UploadedFile::fake()->image('IMG_20250110_080000.jpg', $width, $height);
        $jpeg = file_get_contents($file->getPathname());

        $tiff = 'II'.pack('v', 42).pack('V', 8)
            // IFD0: one entry pointing at the GPS IFD (offset 26).
            .pack('v', 1).pack('vvVV', 0x8825, 4, 1, 26).pack('V', 0)
            // GPS IFD: latitude ref "S" and latitude (3 rationals at offset 56).
            .pack('v', 2)
            .pack('vvV', 0x0001, 2, 2).'S'."\0\0\0"
            .pack('vvVV', 0x0002, 5, 3, 56)
            .pack('V', 0)
            .pack('VVVVVV', 6, 1, 59, 1, 24, 1);
        $exif = "Exif\0\0".$tiff;
        $segment = "\xFF\xE1".pack('n', strlen($exif) + 2).$exif;

        file_put_contents($file->getPathname(), substr($jpeg, 0, 2).$segment.substr($jpeg, 2));

        return $file;
    }
}

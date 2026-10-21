<?php

namespace Tests\Feature\Admin;

use App\Filament\Pages\Settings;
use App\Filament\Resources\GarageItems\Pages\CreateGarageItem;
use App\Jobs\ProcessSettingPhoto;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Livewire\Livewire;
use Tests\TestCase;

class SettingsAndGarageAdminTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('originals');
        Storage::fake('public');
        config(['logbook.admin_email' => 'aku@example.com']);
        $this->actingAs(User::factory()->create(['email' => 'aku@example.com']));
    }

    public function test_settings_are_saved_and_photos_queued(): void
    {
        Queue::fake();

        Livewire::test(Settings::class)
            ->fillForm([
                'site_name' => 'Catatan Jalan',
                'bike_name' => 'Yamaha XSR 155',
                'about_markdown' => 'Halo.',
                'bike_photo' => [UploadedFile::fake()->image('motor.jpg', 1600, 1000)],
                'youtube_url' => 'https://www.youtube.com/@someone',
            ])
            ->call('save')
            ->assertHasNoFormErrors()
            ->assertNotified('Tersimpan');

        $this->assertSame('Catatan Jalan', Setting::query()->findOrFail('site_name')['value']);
        $path = Setting::query()->findOrFail('bike_photo')['value'];
        $this->assertStringStartsWith('settings/', $path);
        Storage::disk('originals')->assertExists($path);
        Queue::assertPushed(ProcessSettingPhoto::class, fn (ProcessSettingPhoto $job) => $job->path === $path);
    }

    public function test_settings_page_renders_with_a_stored_photo(): void
    {
        $image = UploadedFile::fake()->image('m.jpg', 10, 10);
        Storage::disk('originals')->put('settings/motor.jpg', file_get_contents($image->getPathname()));
        Setting::query()->create(['key' => 'bike_photo', 'value' => 'settings/motor.jpg']);

        $this->get('/admin/pengaturan')->assertOk();
    }

    public function test_invalid_links_are_rejected(): void
    {
        Livewire::test(Settings::class)
            ->fillForm(['instagram_url' => 'bukan link'])
            ->call('save')
            ->assertHasFormErrors(['instagram_url']);
    }

    public function test_garage_item_with_hotspot(): void
    {
        Livewire::test(CreateGarageItem::class)
            ->fillForm([
                'name' => 'Ban dual purpose',
                'category' => 'Kaki-kaki',
                'hotspot_x' => 42.5,
                'hotspot_y' => 71,
            ])
            ->call('create')
            ->assertHasNoFormErrors()
            ->assertNotified('Tersimpan');

        $this->getJson('/api/v1/garage')
            ->assertJsonPath('0.name', 'Ban dual purpose')
            ->assertJsonPath('0.hotspot.x', 42.5);
    }

    public function test_hotspot_must_be_a_percentage(): void
    {
        Livewire::test(CreateGarageItem::class)
            ->fillForm(['name' => 'Lampu', 'category' => 'Kelistrikan', 'hotspot_x' => 120, 'hotspot_y' => 10])
            ->call('create')
            ->assertHasFormErrors(['hotspot_x']);
    }
}

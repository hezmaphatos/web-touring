<?php

namespace Tests\Feature\Api;

use App\Models\GarageItem;
use App\Models\Setting;
use App\Models\Trip;
use App\Models\TripStop;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SiteEndpointsTest extends TestCase
{
    use RefreshDatabase;

    public function test_site_returns_settings_and_totals(): void
    {
        Setting::query()->create(['key' => 'site_name', 'value' => 'Catatan Jalan']);
        Setting::query()->create(['key' => 'bike_name', 'value' => 'Yamaha XSR 155']);
        Setting::query()->create(['key' => 'about_markdown', 'value' => 'Halo, *aku*.']);
        Setting::query()->create(['key' => 'instagram_url', 'value' => 'https://instagram.com/someone']);
        Trip::factory()->create(['distance_km' => 100.5]);
        Trip::factory()->draft()->create(['distance_km' => 1000]);

        $this->getJson('/api/v1/site')
            ->assertOk()
            ->assertJsonPath('site_name', 'Catatan Jalan')
            ->assertJsonPath('about_html', '<p>Halo, <em>aku</em>.</p>')
            ->assertJsonPath('bike.name', 'Yamaha XSR 155')
            ->assertJsonPath('bike.photo', null)
            ->assertJsonPath('links.instagram', 'https://instagram.com/someone')
            ->assertJsonPath('links.youtube', null)
            ->assertJsonPath('total_km', 100.5)
            ->assertJsonPath('counts.trips', 1);
    }

    public function test_site_name_falls_back_to_env(): void
    {
        config(['logbook.site_name' => 'Logbook']);

        $this->getJson('/api/v1/site')->assertOk()->assertJsonPath('site_name', 'Logbook');
    }

    public function test_map_includes_published_and_planned_but_not_drafts(): void
    {
        $published = Trip::factory()->create(['slug' => 'dieng', 'route_geojson' => ['type' => 'LineString', 'coordinates' => [[109.9, -7.2], [110.4, -7.38]]]]);
        TripStop::factory()->for($published)->create(['name' => 'Dieng', 'lat' => -7.2, 'lng' => 109.91]);
        Trip::factory()->planned()->create(['slug' => 'someday']);
        Trip::factory()->draft()->create(['slug' => 'secret-draft']);

        $response = $this->getJson('/api/v1/map')->assertOk();

        $this->assertSame(['dieng', 'someday'], array_column($response->json(), 'slug'));
        $response->assertJsonPath('0.number', 1)
            ->assertJsonPath('0.stops.0.lat', -7.2)
            ->assertJsonPath('0.route_geojson.type', 'LineString')
            ->assertJsonPath('1.status', 'planned')
            ->assertJsonPath('1.number', null)
            ->assertJsonPath('1.planned_for', 'musim kemarau');
    }

    public function test_stats_endpoint(): void
    {
        Trip::factory()->dated('2025-01-10', '2025-01-12')->create(['distance_km' => 612]);

        $this->getJson('/api/v1/stats')
            ->assertOk()
            ->assertJsonPath('total_km', 612)
            ->assertJsonPath('trips', 1)
            ->assertJsonPath('days_on_road', 3)
            ->assertJsonPath('km_per_year.0.year', 2025);
    }

    public function test_garage_lists_items_in_order(): void
    {
        GarageItem::factory()->create(['name' => 'Knalpot', 'position' => 2, 'hotspot_x' => 40.5, 'hotspot_y' => 60]);
        GarageItem::factory()->create(['name' => 'Ban dual purpose', 'position' => 1, 'description' => 'Lebih **gigit**.']);

        $this->getJson('/api/v1/garage')
            ->assertOk()
            ->assertJsonPath('0.name', 'Ban dual purpose')
            ->assertJsonPath('0.hotspot', null)
            ->assertJsonPath('0.description_html', '<p>Lebih <strong>gigit</strong>.</p>')
            ->assertJsonPath('1.hotspot.x', 40.5)
            ->assertJsonPath('1.hotspot.y', 60)
            ->assertJsonPath('1.photo', null);
    }

    public function test_next_rides_lists_only_planned_trips(): void
    {
        $planned = Trip::factory()->planned()->create(['slug' => 'someday', 'description' => 'Karena *penasaran*.']);
        TripStop::factory()->for($planned)->count(2)->create();
        Trip::factory()->create(['slug' => 'published']);
        Trip::factory()->draft()->create(['slug' => 'secret-draft']);

        $response = $this->getJson('/api/v1/next-rides')->assertOk();

        $this->assertSame(['someday'], array_column($response->json(), 'slug'));
        $response->assertJsonPath('0.planned_for', 'musim kemarau')
            ->assertJsonPath('0.note_html', '<p>Karena <em>penasaran</em>.</p>')
            ->assertJsonCount(2, '0.stops');
    }

    public function test_api_is_read_only(): void
    {
        $this->postJson('/api/v1/trips', ['title' => 'x'])->assertStatus(405);
        $this->deleteJson('/api/v1/trips/dieng')->assertStatus(405);
    }
}

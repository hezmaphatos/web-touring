<?php

namespace Tests\Feature;

use App\Jobs\RevalidateFrontend;
use App\Models\GarageItem;
use App\Models\Setting;
use App\Models\Trip;
use App\Models\TripStop;
use App\Services\RevalidationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class RevalidationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'logbook.revalidate_url' => 'http://frontend.test/api/revalidate',
            'logbook.revalidate_secret' => 'test-secret',
        ]);
    }

    public function test_saving_content_queues_revalidation_with_tags(): void
    {
        Queue::fake();

        $trip = Trip::factory()->create();
        Queue::assertPushed(RevalidateFrontend::class, fn (RevalidateFrontend $job) => $job->tags === ['trips', 'site']);

        TripStop::factory()->for($trip)->create();
        GarageItem::factory()->create();
        Queue::assertPushed(RevalidateFrontend::class, fn (RevalidateFrontend $job) => $job->tags === ['garage']);

        Setting::query()->create(['key' => 'bike_name', 'value' => 'XSR']);
        Queue::assertPushed(RevalidateFrontend::class, fn (RevalidateFrontend $job) => $job->tags === ['site']);

        // Jobs are unique per tag set until processed: the stop and the delete add no new job.
        $trip->delete();
        Queue::assertPushed(RevalidateFrontend::class, 3);
    }

    public function test_no_job_without_a_frontend_url(): void
    {
        Queue::fake();
        config(['logbook.revalidate_url' => null]);

        Trip::factory()->create();

        Queue::assertNothingPushed();
    }

    public function test_job_calls_the_frontend_with_the_secret(): void
    {
        Http::fake(['frontend.test/*' => Http::response(['revalidated' => true])]);

        (new RevalidateFrontend(['trips', 'site']))->handle(app(RevalidationService::class));

        Http::assertSent(fn (Request $request) => $request->url() === 'http://frontend.test/api/revalidate'
            && $request->hasHeader('x-revalidate-secret', 'test-secret')
            && $request['tags'] === ['trips', 'site']);
    }

    public function test_cached_api_responses_are_invalidated_on_change(): void
    {
        Queue::fake();
        $trip = Trip::factory()->create(['slug' => 'dieng', 'title' => 'Dieng']);

        $this->getJson('/api/v1/trips/dieng')->assertJsonPath('title', 'Dieng');

        $trip->update(['title' => 'Dieng Plateau']);
        $this->getJson('/api/v1/trips/dieng')->assertJsonPath('title', 'Dieng Plateau');

        $trip->update(['status' => 'draft']);
        $this->getJson('/api/v1/trips/dieng')->assertNotFound();
        $this->getJson('/api/v1/trips')->assertExactJson([]);
    }
}

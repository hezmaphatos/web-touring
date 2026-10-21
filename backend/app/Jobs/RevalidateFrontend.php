<?php

namespace App\Jobs;

use App\Services\RevalidationService;
use Illuminate\Contracts\Queue\ShouldBeUniqueUntilProcessing;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

/**
 * Tells the Next.js site to refetch data for the given cache tags.
 * Unique until processing: a burst of saves (one trip with many stops) sends one request.
 */
class RevalidateFrontend implements ShouldBeUniqueUntilProcessing, ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public int $backoff = 15;

    /**
     * @param  list<string>  $tags
     */
    public function __construct(public array $tags) {}

    public function uniqueId(): string
    {
        return implode(',', $this->tags);
    }

    public function handle(RevalidationService $revalidation): void
    {
        $revalidation->notifyFrontend($this->tags);
    }
}

<?php

namespace App\Jobs;

use App\Models\Setting;
use App\Services\MediaService;
use App\Services\RevalidationService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

/**
 * Generates the public variants of a settings photo (bike, portrait).
 */
class ProcessSettingPhoto implements ShouldQueue
{
    use Queueable;

    public int $timeout = 600;

    public function __construct(public string $path) {}

    public function handle(MediaService $media, RevalidationService $revalidation): void
    {
        $media->makeStoredVariants($this->path);
        $revalidation->modelChanged(Setting::class);
    }
}

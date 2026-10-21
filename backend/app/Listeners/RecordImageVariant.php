<?php

namespace App\Listeners;

use App\Services\MediaService;
use App\Services\RevalidationService;
use Spatie\MediaLibrary\Conversions\Events\ConversionHasBeenCompletedEvent;

class RecordImageVariant
{
    public function __construct(
        private MediaService $media,
        private RevalidationService $revalidation,
    ) {}

    public function handle(ConversionHasBeenCompletedEvent $event): void
    {
        $ready = $this->media->conversionCompleted($event->media, $event->conversion->getName());

        if ($ready) {
            $this->revalidation->modelChanged($event->media['model_type']);
        }
    }
}

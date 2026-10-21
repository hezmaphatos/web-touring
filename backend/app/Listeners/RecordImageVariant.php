<?php

namespace App\Listeners;

use App\Services\MediaService;
use Spatie\MediaLibrary\Conversions\Events\ConversionHasBeenCompletedEvent;

class RecordImageVariant
{
    public function __construct(private MediaService $media) {}

    public function handle(ConversionHasBeenCompletedEvent $event): void
    {
        $this->media->conversionCompleted($event->media, $event->conversion->getName());
    }
}

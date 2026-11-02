<?php

namespace App\Listeners;

use App\Services\MediaService;
use Spatie\MediaLibrary\MediaCollections\Events\MediaHasBeenAddedEvent;

/**
 * Runs right after an upload is stored and before its variants are made.
 */
class ShrinkOriginal
{
    public function __construct(private MediaService $media) {}

    public function handle(MediaHasBeenAddedEvent $event): void
    {
        $media = $event->media;
        $size = $this->media->shrinkOriginal($media['disk'], $media->getPathRelativeToRoot());

        if ($size !== null) {
            $media->size = $size;
            $media->save();
        }
    }
}

<?php

namespace App\Models\Concerns;

use App\Services\MediaService;
use Spatie\Image\Enums\Fit;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\MediaCollection;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

/**
 * Shared image pipeline: WebP (and AVIF when supported) at fixed widths plus a tiny LQIP.
 * Variants are re-encoded by GD, which drops EXIF/GPS metadata.
 */
trait HasImageVariants
{
    use InteractsWithMedia;

    public function registerMediaConversions(?Media $media = null): void
    {
        foreach (MediaService::WIDTHS as $width) {
            $this->addMediaConversion("webp-{$width}")
                ->format('webp')
                ->fit(Fit::Max, $width, $width * 4)
                ->quality(MediaService::WEBP_QUALITY)
                ->nonOptimized();

            if (MediaService::avifEnabled()) {
                $this->addMediaConversion("avif-{$width}")
                    ->format('avif')
                    ->fit(Fit::Max, $width, $width * 4)
                    ->quality(MediaService::AVIF_QUALITY)
                    ->nonOptimized();
            }
        }

        $this->addMediaConversion('lqip')
            ->format('webp')
            ->fit(Fit::Max, MediaService::LQIP_WIDTH, MediaService::LQIP_WIDTH * 4)
            ->quality(40)
            ->nonOptimized();
    }

    protected function addImageCollection(string $name): MediaCollection
    {
        // Explicit disk: Filament uploads otherwise fall back to its own default disk.
        return $this->addMediaCollection($name)
            ->useDisk((string) config('media-library.disk_name'))
            ->singleFile()
            ->acceptsMimeTypes(MediaService::MIME_TYPES);
    }
}

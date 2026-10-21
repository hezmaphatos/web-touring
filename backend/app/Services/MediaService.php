<?php

namespace App\Services;

use Illuminate\Support\Facades\Storage;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

/**
 * Builds public image payloads (srcset, dimensions, LQIP) from stored variants.
 */
class MediaService
{
    public const WIDTHS = [480, 800, 1200, 1600, 2400];

    public const LARGEST_WIDTH = 2400;

    /** `src` (and the Open Graph image) is the largest variant up to this width. */
    public const SRC_WIDTH = 1200;

    public const LQIP_WIDTH = 24;

    public const WEBP_QUALITY = 78;

    public const AVIF_QUALITY = 55;

    public const MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

    /** Upload limit in kilobytes (25 MB). */
    public const MAX_UPLOAD_KB = 25600;

    public static function avifEnabled(): bool
    {
        return (bool) config('logbook.avif') && function_exists('imageavif');
    }

    /**
     * First media item of a collection from an eager-loaded `media` relation (as array).
     */
    public function first(array $mediaList, string $collection): ?array
    {
        foreach ($mediaList as $media) {
            if ($media['collection_name'] === $collection) {
                return $media;
            }
        }

        return null;
    }

    /**
     * Public payload for a media item, or null while its variants are not generated yet.
     */
    public function image(?array $media, string $alt): ?array
    {
        if ($media === null) {
            return null;
        }

        $properties = $media['custom_properties'] ?? [];
        $generated = $media['generated_conversions'] ?? [];

        if (! isset($properties['width'], $properties['height']) || empty($generated['webp-'.self::LARGEST_WIDTH])) {
            return null;
        }

        $disk = Storage::disk($media['conversions_disk']);
        $base = $this->conversionDirectory($media);
        $largest = (int) $properties['width'];
        $webp = [];
        $avif = [];
        $seen = [];
        $src = null;

        foreach (self::WIDTHS as $width) {
            // Variants never upscale, so small originals produce duplicate widths.
            $actual = min($width, $largest);

            if (isset($seen[$actual])) {
                continue;
            }

            $seen[$actual] = true;

            if (! empty($generated["webp-{$width}"])) {
                $url = $disk->url("{$base}webp-{$width}.webp");
                $webp[] = "{$url} {$actual}w";

                if ($width <= self::SRC_WIDTH) {
                    $src = $url;
                }
            }

            if (! empty($generated["avif-{$width}"])) {
                $avif[] = $disk->url("{$base}avif-{$width}.avif")." {$actual}w";
            }
        }

        return [
            'src' => $src,
            'srcset' => implode(', ', $webp),
            'avif_srcset' => $avif === [] ? null : implode(', ', $avif),
            'width' => $largest,
            'height' => (int) $properties['height'],
            'placeholder' => $properties['lqip'] ?? null,
            'alt' => $alt,
        ];
    }

    /**
     * Called after each conversion: records the largest variant's size and inlines the LQIP.
     * Returns true when the last conversion (lqip) finished, i.e. the image is ready.
     */
    public function conversionCompleted(Media $media, string $conversionName): bool
    {
        if ($conversionName !== 'webp-'.self::LARGEST_WIDTH && $conversionName !== 'lqip') {
            return false;
        }

        $contents = Storage::disk($media['conversions_disk'])->get($media->getPathRelativeToRoot($conversionName));

        if ($contents === null) {
            return false;
        }

        if ($conversionName === 'lqip') {
            $media->setCustomProperty('lqip', 'data:image/webp;base64,'.base64_encode($contents));
        } else {
            $size = getimagesizefromstring($contents);
            $media->setCustomProperty('width', $size[0]);
            $media->setCustomProperty('height', $size[1]);
        }

        $media->save();

        return $conversionName === 'lqip';
    }

    /**
     * Payload for an image processed outside the media library (settings photos).
     * Variants and a meta.json live in a public directory derived from the original path.
     */
    public function storedImage(?string $originalPath, string $alt): ?array
    {
        if ($originalPath === null || $originalPath === '') {
            return null;
        }

        $disk = Storage::disk('public');
        $meta = $disk->get($this->storedDirectory($originalPath).'/meta.json');

        if ($meta === null) {
            return null;
        }

        $image = json_decode($meta, true);

        if (! is_array($image)) {
            return null;
        }

        $image['alt'] = $alt;

        return $image;
    }

    public function storedDirectory(string $originalPath): string
    {
        return 'site/'.pathinfo($originalPath, PATHINFO_FILENAME);
    }

    private function conversionDirectory(array $media): string
    {
        $prefix = (string) config('media-library.prefix', '');

        return ($prefix === '' ? '' : $prefix.'/').$media['id'].'/conversions/';
    }
}

<?php

namespace App\Services;

use Closure;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Spatie\Image\Enums\Fit;
use Spatie\Image\Image;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

/**
 * Builds public image payloads (srcset, dimensions, LQIP) from stored variants.
 * Every public variant is re-encoded by GD, so no EXIF/GPS metadata survives.
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
     * Public payload for a media library item, or null while its variants are not generated yet.
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
        $prefix = (string) config('media-library.prefix', '');
        $base = ($prefix === '' ? '' : $prefix.'/').$media['id'].'/conversions/';

        return $this->payload(
            fn (string $name, string $extension) => empty($generated[$name]) ? null : $disk->url("{$base}{$name}.{$extension}"),
            (int) $properties['width'],
            (int) $properties['height'],
            $properties['lqip'] ?? null,
        ) + ['alt' => $alt];
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
            $media->setCustomProperty('lqip', $this->dataUri($contents));
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
     */
    public function storedImage(?string $originalPath, string $alt): ?array
    {
        if ($originalPath === null || $originalPath === '') {
            return null;
        }

        $meta = Storage::disk('public')->get($this->storedDirectory($originalPath).'/meta.json');
        $image = $meta === null ? null : json_decode($meta, true);

        return is_array($image) ? $image + ['alt' => $alt] : null;
    }

    /**
     * Admin upload preview for a settings photo: points at the small public variant,
     * never at the private original. The URL is null until the variants exist.
     *
     * @return array{name: string, size: int, type: ?string, url: ?string}|null
     */
    public function storedPreview(string $originalPath): ?array
    {
        $originals = Storage::disk('originals');

        if (! $originals->exists($originalPath)) {
            return null;
        }

        $public = Storage::disk('public');
        $preview = $this->storedDirectory($originalPath).'/webp-480.webp';

        return [
            'name' => basename($originalPath),
            'size' => (int) $originals->size($originalPath),
            'type' => $originals->mimeType($originalPath) ?: null,
            'url' => $public->exists($preview) ? $public->url($preview) : null,
        ];
    }

    /**
     * Generates public variants and a meta.json payload for an original on the private disk.
     */
    public function makeStoredVariants(string $originalPath): void
    {
        $directory = $this->storedDirectory($originalPath);
        $public = Storage::disk('public');
        $temporary = storage_path('app/tmp/'.Str::random(16));
        File::ensureDirectoryExists($temporary);

        try {
            $source = $temporary.'/original.'.pathinfo($originalPath, PATHINFO_EXTENSION);
            file_put_contents($source, Storage::disk('originals')->get($originalPath));

            $public->deleteDirectory($directory);
            $variants = [];

            foreach (self::WIDTHS as $width) {
                $variants["webp-{$width}"] = $this->encode($source, $temporary, "webp-{$width}", 'webp', $width, self::WEBP_QUALITY);

                if (self::avifEnabled()) {
                    $variants["avif-{$width}"] = $this->encode($source, $temporary, "avif-{$width}", 'avif', $width, self::AVIF_QUALITY);
                }
            }

            $lqip = $this->encode($source, $temporary, 'lqip', 'webp', self::LQIP_WIDTH, 40);

            foreach ($variants as $file) {
                $public->put($directory.'/'.basename($file), file_get_contents($file));
            }

            $size = getimagesize($variants['webp-'.self::LARGEST_WIDTH]);
            $payload = $this->payload(
                fn (string $name, string $extension) => isset($variants[$name]) ? $public->url("{$directory}/{$name}.{$extension}") : null,
                $size[0],
                $size[1],
                $this->dataUri(file_get_contents($lqip)),
            );

            $public->put($directory.'/meta.json', json_encode($payload, JSON_UNESCAPED_SLASHES));
        } finally {
            File::deleteDirectory($temporary);
        }
    }

    /**
     * Removes a settings photo: the private original and its public variants.
     */
    public function deleteStoredImage(string $originalPath): void
    {
        Storage::disk('originals')->delete($originalPath);
        Storage::disk('public')->deleteDirectory($this->storedDirectory($originalPath));
    }

    public function storedDirectory(string $originalPath): string
    {
        return 'site/'.pathinfo($originalPath, PATHINFO_FILENAME);
    }

    /**
     * @param  Closure(string, string): ?string  $urlFor  URL of a variant by name and extension, null if missing
     */
    private function payload(Closure $urlFor, int $width, int $height, ?string $placeholder): array
    {
        $webp = [];
        $avif = [];
        $seen = [];
        $src = null;

        foreach (self::WIDTHS as $variantWidth) {
            // Variants never upscale, so small originals produce duplicate widths.
            $actual = min($variantWidth, $width);

            if (isset($seen[$actual])) {
                continue;
            }

            $seen[$actual] = true;
            $webpUrl = $urlFor("webp-{$variantWidth}", 'webp');
            $avifUrl = $urlFor("avif-{$variantWidth}", 'avif');

            if ($webpUrl !== null) {
                $webp[] = "{$webpUrl} {$actual}w";

                if ($variantWidth <= self::SRC_WIDTH) {
                    $src = $webpUrl;
                }
            }

            if ($avifUrl !== null) {
                $avif[] = "{$avifUrl} {$actual}w";
            }
        }

        return [
            'src' => $src,
            'srcset' => implode(', ', $webp),
            'avif_srcset' => $avif === [] ? null : implode(', ', $avif),
            'width' => $width,
            'height' => $height,
            'placeholder' => $placeholder,
        ];
    }

    private function encode(string $source, string $directory, string $name, string $format, int $width, int $quality): string
    {
        $target = "{$directory}/{$name}.{$format}";

        Image::load($source)
            ->fit(Fit::Max, $width, $width * 4)
            ->quality($quality)
            ->format($format)
            ->save($target);

        return $target;
    }

    private function dataUri(string $webp): string
    {
        return 'data:image/webp;base64,'.base64_encode($webp);
    }
}

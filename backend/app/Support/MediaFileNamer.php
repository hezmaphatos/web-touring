<?php

namespace App\Support;

use Spatie\MediaLibrary\Conversions\Conversion;
use Spatie\MediaLibrary\Support\FileNamer\DefaultFileNamer;

/**
 * Public variants are named after the conversion only ("webp-800.webp"),
 * so the original upload's file name never reaches a public URL.
 */
class MediaFileNamer extends DefaultFileNamer
{
    public function conversionFileName(string $fileName, Conversion $conversion): string
    {
        return $conversion->getName();
    }
}

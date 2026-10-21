<?php

namespace App\Services;

/**
 * Parses coordinates pasted from Google Maps ("-6.990123, 106.310456").
 */
class CoordinateService
{
    public const INVALID_MESSAGE = 'Koordinat harus berformat "lat, lng", contoh: -6.99, 106.31 (salin dari Google Maps).';

    /**
     * @return array{lat: float, lng: float}|null
     */
    public function parse(?string $input): ?array
    {
        if ($input === null) {
            return null;
        }

        $value = trim(str_replace(['(', ')'], '', $input));

        if (! preg_match('/^(-?\d{1,2}(?:\.\d+)?)\s*[,;\s]\s*(-?\d{1,3}(?:\.\d+)?)$/', $value, $matches)) {
            return null;
        }

        $lat = (float) $matches[1];
        $lng = (float) $matches[2];

        if ($lat < -90 || $lat > 90 || $lng < -180 || $lng > 180) {
            return null;
        }

        return ['lat' => round($lat, 7), 'lng' => round($lng, 7)];
    }

    public function format(float|string|null $lat, float|string|null $lng): ?string
    {
        if ($lat === null || $lng === null) {
            return null;
        }

        return $this->trimNumber((float) $lat).', '.$this->trimNumber((float) $lng);
    }

    private function trimNumber(float $value): string
    {
        $text = rtrim(rtrim(number_format($value, 7, '.', ''), '0'), '.');

        return $text === '-0' ? '0' : $text;
    }
}

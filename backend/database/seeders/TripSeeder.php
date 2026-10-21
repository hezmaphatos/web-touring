<?php

namespace Database\Seeders;

use App\Models\Trip;
use App\Models\TripStop;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * Placeholder trips so the site is never empty. Idempotent: existing trips (matched by slug)
 * are left untouched, so the owner's edits survive a re-run.
 * Dates, distances and stories stay empty on purpose: they are filled in by the owner.
 */
class TripSeeder extends Seeder
{
    /** Title, type, approximate coordinate (verify in admin), province. */
    private const DESTINATIONS = [
        ['Sawarna', 'coast', -6.99, 106.31, 'Banten'],
        ['Ujung Kulon', 'forest', -6.75, 105.33, 'Banten'],
        ['Citorek', 'highland', -6.79, 106.19, 'Banten'],
        ['Bandung', 'city', -6.91, 107.61, 'Jawa Barat'],
        ['Majalengka', 'highland', -6.84, 108.23, 'Jawa Barat'],
        ['Dieng', 'highland', -7.20, 109.91, 'Jawa Tengah'],
        ['Telomoyo', 'highland', -7.38, 110.40, 'Jawa Tengah'],
        ['Gunungkidul', 'coast', -8.03, 110.60, 'DI Yogyakarta'],
    ];

    /** Chapter colors (RGB) from the design tokens; city uses black. */
    private const COLORS = [
        'coast' => [13, 79, 158],
        'highland' => [106, 59, 29],
        'forest' => [10, 107, 67],
        'city' => [0, 0, 0],
    ];

    public function run(): void
    {
        // Convert inline so covers are ready without a queue worker.
        config(['media-library.queue_conversions_by_default' => false]);

        foreach (self::DESTINATIONS as [$title, $type, $lat, $lng, $province]) {
            $trip = Trip::query()->firstOrCreate(['slug' => Str::slug($title)], [
                'title' => $title,
                'type' => $type,
                'status' => 'published',
                'summary' => 'TODO: isi ringkasan satu baris.',
            ]);

            if (! $trip->wasRecentlyCreated) {
                continue;
            }

            TripStop::query()->create([
                'trip_id' => $trip['id'],
                'position' => 1,
                'name' => $title,
                'province' => $province,
                'lat' => $lat,
                'lng' => $lng,
                'note' => 'TODO: isi cerita.',
            ]);

            $trip->addMedia($this->placeholderCover($title, $type))
                ->usingFileName(Str::slug($title).'-sampul.png')
                ->toMediaCollection('cover');
        }

        $this->seedPlannedExample();
    }

    private function seedPlannedExample(): void
    {
        $trip = Trip::query()->firstOrCreate(['slug' => 'contoh-rencana'], [
            'title' => 'Contoh rencana',
            'type' => 'highland',
            'status' => 'planned',
            'summary' => 'Contoh trip rencana. Ganti atau hapus lewat admin.',
            'planned_for' => 'TODO: isi kapan, misalnya musim kemarau 2027',
            'description' => 'Ini contoh trip rencana supaya halaman Next ride bisa dicek. Ganti isinya atau hapus trip ini lewat admin.',
        ]);

        if (! $trip->wasRecentlyCreated) {
            return;
        }

        TripStop::query()->create([
            'trip_id' => $trip['id'], 'position' => 1, 'name' => 'Contoh titik awal',
            'lat' => -6.91, 'lng' => 107.61,
        ]);
        TripStop::query()->create([
            'trip_id' => $trip['id'], 'position' => 2, 'name' => 'Contoh titik akhir',
            'lat' => -7.20, 'lng' => 109.91,
        ]);
    }

    /**
     * A flat block in the chapter color with the trip name. Returns a temporary PNG path.
     */
    private function placeholderCover(string $title, string $type): string
    {
        $width = 1600;
        $height = 1000;
        $margin = 80;
        $font = resource_path('fonts/ArchivoBlack-Regular.ttf');
        [$red, $green, $blue] = self::COLORS[$type];

        $image = imagecreatetruecolor($width, $height);
        imagefill($image, 0, 0, imagecolorallocate($image, $red, $green, $blue));
        $ink = imagecolorallocate($image, 245, 245, 242);

        $text = mb_strtoupper($title);
        $size = 220;

        while ($size > 40) {
            $box = imagettfbbox($size, 0, $font, $text);

            if ($width - $margin * 2 >= $box[2] - $box[0]) {
                break;
            }

            $size -= 8;
        }

        imagettftext($image, $size, 0, $margin, $height - $margin - 20, $ink, $font, $text);
        imagettftext($image, 34, 0, $margin, $margin + 34, $ink, $font, 'Sampul sementara');

        $path = sys_get_temp_dir().DIRECTORY_SEPARATOR.Str::random(16).'.png';
        imagepng($image, $path);
        imagedestroy($image);

        return $path;
    }
}

<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

/**
 * Default settings. Existing values are never overwritten.
 */
class SettingSeeder extends Seeder
{
    public function run(): void
    {
        $defaults = [
            'site_name' => config('logbook.site_name'),
            'about_markdown' => 'TODO: isi cerita tentang aku dan motor ini.',
            'bike_name' => 'Yamaha XSR 155',
        ];

        foreach ($defaults as $key => $value) {
            Setting::query()->firstOrCreate(['key' => $key], ['value' => $value]);
        }
    }
}

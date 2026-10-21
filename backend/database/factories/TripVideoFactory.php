<?php

namespace Database\Factories;

use App\Models\Trip;
use App\Models\TripVideo;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TripVideo>
 */
class TripVideoFactory extends Factory
{
    public function definition(): array
    {
        return [
            'trip_id' => Trip::factory(),
            'stop_id' => null,
            'position' => 1,
            'youtube_url' => 'https://youtu.be/dQw4w9WgXcQ',
            'youtube_id' => 'dQw4w9WgXcQ',
            'title' => null,
        ];
    }
}

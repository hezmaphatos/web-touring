<?php

namespace Database\Factories;

use App\Models\Trip;
use App\Models\TripPhoto;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TripPhoto>
 */
class TripPhotoFactory extends Factory
{
    public function definition(): array
    {
        return [
            'trip_id' => Trip::factory(),
            'stop_id' => null,
            'position' => 1,
            'caption' => null,
        ];
    }
}

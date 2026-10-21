<?php

namespace Database\Factories;

use App\Models\Trip;
use App\Models\TripStop;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TripStop>
 */
class TripStopFactory extends Factory
{
    public function definition(): array
    {
        return [
            'trip_id' => Trip::factory(),
            'position' => 1,
            'name' => fake()->city(),
            'province' => null,
            'lat' => fake()->randomFloat(4, -8.5, -6),
            'lng' => fake()->randomFloat(4, 105, 114),
            'km_marker' => null,
            'note' => null,
        ];
    }
}

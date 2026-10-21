<?php

namespace Database\Factories;

use App\Models\GarageItem;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<GarageItem>
 */
class GarageItemFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => fake()->words(2, true),
            'category' => 'Kaki-kaki',
            'description' => null,
            'installed_at' => null,
            'hotspot_x' => null,
            'hotspot_y' => null,
            'position' => 1,
        ];
    }
}

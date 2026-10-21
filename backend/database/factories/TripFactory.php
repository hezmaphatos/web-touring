<?php

namespace Database\Factories;

use App\Models\Trip;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Trip>
 */
class TripFactory extends Factory
{
    public function definition(): array
    {
        $title = Str::title(fake()->unique()->words(2, true));

        return [
            'title' => $title,
            'slug' => Str::slug($title),
            'type' => fake()->randomElement(Trip::TYPES),
            'status' => 'published',
            'started_at' => null,
            'ended_at' => null,
            'distance_km' => null,
            'max_elevation_m' => null,
            'summary' => fake()->sentence(),
            'description' => null,
        ];
    }

    public function draft(): static
    {
        return $this->state(fn () => ['status' => 'draft']);
    }

    public function planned(): static
    {
        return $this->state(fn () => ['status' => 'planned', 'planned_for' => 'musim kemarau']);
    }

    public function dated(string $start, ?string $end = null): static
    {
        return $this->state(fn () => ['started_at' => $start, 'ended_at' => $end]);
    }
}

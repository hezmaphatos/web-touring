<?php

namespace App\Models;

use App\Models\Concerns\HasImageVariants;
use Database\Factories\TripFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\MediaLibrary\HasMedia;

#[Fillable([
    'title', 'slug', 'type', 'status', 'started_at', 'ended_at', 'distance_km', 'max_elevation_m',
    'summary', 'description', 'pull_quote', 'planned_for', 'route_geojson',
])]
class Trip extends Model implements HasMedia
{
    /** @use HasFactory<TripFactory> */
    use HasFactory, HasImageVariants;

    public const TYPES = ['coast', 'highland', 'forest', 'city'];

    public const STATUSES = ['draft', 'published', 'planned'];

    protected function casts(): array
    {
        return [
            'started_at' => 'date:Y-m-d',
            'ended_at' => 'date:Y-m-d',
            'distance_km' => 'decimal:1',
            'max_elevation_m' => 'integer',
            'route_geojson' => 'array',
        ];
    }

    public function stops(): HasMany
    {
        return $this->hasMany(TripStop::class)->orderBy('position');
    }

    public function photos(): HasMany
    {
        return $this->hasMany(TripPhoto::class)->orderBy('position');
    }

    public function videos(): HasMany
    {
        return $this->hasMany(TripVideo::class)->orderBy('position');
    }

    public function registerMediaCollections(): void
    {
        $this->addImageCollection('cover');
    }
}

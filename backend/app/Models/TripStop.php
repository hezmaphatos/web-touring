<?php

namespace App\Models;

use Database\Factories\TripStopFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['trip_id', 'position', 'name', 'province', 'lat', 'lng', 'km_marker', 'note'])]
class TripStop extends Model
{
    /** @use HasFactory<TripStopFactory> */
    use HasFactory;

    public $timestamps = false;

    protected function casts(): array
    {
        return [
            'position' => 'integer',
            'lat' => 'float',
            'lng' => 'float',
            'km_marker' => 'decimal:1',
        ];
    }

    public function trip(): BelongsTo
    {
        return $this->belongsTo(Trip::class);
    }
}

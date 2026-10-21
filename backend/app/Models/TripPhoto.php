<?php

namespace App\Models;

use App\Models\Concerns\HasImageVariants;
use Database\Factories\TripPhotoFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\MediaLibrary\HasMedia;

#[Fillable(['trip_id', 'stop_id', 'position', 'caption'])]
class TripPhoto extends Model implements HasMedia
{
    /** @use HasFactory<TripPhotoFactory> */
    use HasFactory, HasImageVariants;

    public $timestamps = false;

    protected function casts(): array
    {
        return [
            'position' => 'integer',
        ];
    }

    public function trip(): BelongsTo
    {
        return $this->belongsTo(Trip::class);
    }

    public function stop(): BelongsTo
    {
        return $this->belongsTo(TripStop::class, 'stop_id');
    }

    public function registerMediaCollections(): void
    {
        $this->addImageCollection('image');
    }
}

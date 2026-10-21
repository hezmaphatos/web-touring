<?php

namespace App\Models;

use App\Models\Concerns\HasImageVariants;
use App\Observers\ContentObserver;
use Database\Factories\GarageItemFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\MediaLibrary\HasMedia;

#[ObservedBy(ContentObserver::class)]
#[Fillable(['name', 'category', 'description', 'installed_at', 'hotspot_x', 'hotspot_y', 'position'])]
class GarageItem extends Model implements HasMedia
{
    /** @use HasFactory<GarageItemFactory> */
    use HasFactory, HasImageVariants;

    public $timestamps = false;

    protected function casts(): array
    {
        return [
            'installed_at' => 'date:Y-m-d',
            'hotspot_x' => 'float',
            'hotspot_y' => 'float',
            'position' => 'integer',
        ];
    }

    public function registerMediaCollections(): void
    {
        $this->addImageCollection('photo');
    }
}

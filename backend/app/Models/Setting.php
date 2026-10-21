<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['key', 'value'])]
class Setting extends Model
{
    public const KEYS = [
        'site_name', 'about_markdown', 'bike_name', 'bike_photo', 'portrait_photo',
        'youtube_url', 'instagram_url',
    ];

    public const PHOTO_KEYS = ['bike_photo', 'portrait_photo'];

    protected $primaryKey = 'key';

    protected $keyType = 'string';

    public $incrementing = false;

    public $timestamps = false;
}

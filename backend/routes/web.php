<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'name' => config('logbook.site_name'),
        'api' => url('/api/v1'),
    ]);
});

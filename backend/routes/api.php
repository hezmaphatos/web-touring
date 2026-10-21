<?php

use App\Http\Controllers\Api\V1\GarageController;
use App\Http\Controllers\Api\V1\MapController;
use App\Http\Controllers\Api\V1\NextRideController;
use App\Http\Controllers\Api\V1\SiteController;
use App\Http\Controllers\Api\V1\StatsController;
use App\Http\Controllers\Api\V1\TripController;
use Illuminate\Support\Facades\Route;

Route::middleware('throttle:api')->group(function () {
    Route::get('/site', SiteController::class);
    Route::get('/trips', [TripController::class, 'index']);
    Route::get('/trips/{slug}', [TripController::class, 'show'])->where('slug', '[a-z0-9-]+');
    Route::get('/map', MapController::class);
    Route::get('/stats', StatsController::class);
    Route::get('/garage', GarageController::class);
    Route::get('/next-rides', NextRideController::class);
});

<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\GarageService;
use Illuminate\Http\JsonResponse;

class GarageController extends Controller
{
    public function __invoke(GarageService $garage): JsonResponse
    {
        return response()->json($garage->items());
    }
}

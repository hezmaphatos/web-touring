<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\TripService;
use Illuminate\Http\JsonResponse;

class NextRideController extends Controller
{
    public function __invoke(TripService $trips): JsonResponse
    {
        return response()->json($trips->planned());
    }
}

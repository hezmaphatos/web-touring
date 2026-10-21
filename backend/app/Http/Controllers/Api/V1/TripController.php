<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\TripService;
use Illuminate\Http\JsonResponse;

class TripController extends Controller
{
    public function index(TripService $trips): JsonResponse
    {
        return response()->json($trips->published());
    }

    public function show(string $slug, TripService $trips): JsonResponse
    {
        $trip = $trips->findPublished($slug);

        abort_if($trip === null, 404);

        return response()->json($trip);
    }
}

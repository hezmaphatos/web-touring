<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\MapService;
use Illuminate\Http\JsonResponse;

class MapController extends Controller
{
    public function __invoke(MapService $map): JsonResponse
    {
        return response()->json($map->map());
    }
}

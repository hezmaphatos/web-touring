<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\SiteService;
use Illuminate\Http\JsonResponse;

class SiteController extends Controller
{
    public function __invoke(SiteService $site): JsonResponse
    {
        return response()->json($site->site());
    }
}

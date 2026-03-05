<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\FeatureFlagService;
use Illuminate\Http\JsonResponse;

/**
 * Read-only public endpoint for global feature flags.
 *
 * The frontend hydrates its useGlobalFeatureFlags() hook with this payload
 * during the initial app bootstrap so gated UI never flickers. Because the
 * underlying service caches the full key=>bool map, this endpoint is a single
 * cache read — no DB round-trip on the hot path.
 */
final class FeatureFlagController extends Controller
{
    public function __invoke(FeatureFlagService $flags): JsonResponse
    {
        return response()->json([
            'data' => $flags->all(),
        ]);
    }
}

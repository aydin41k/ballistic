<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AppSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class SettingsController extends Controller
{
    /**
     * Show the current global feature flags.
     */
    public function showFeatures(): JsonResponse
    {
        return response()->json([
            'data' => AppSetting::globalFeatureFlags(),
        ]);
    }

    /**
     * Update one or more global feature flags (partial update).
     */
    public function updateFeatures(Request $request): JsonResponse
    {
        $allowedKeys = ['dates', 'delegation', 'ai_assistant'];

        $validated = $request->validate([
            'dates' => ['sometimes', 'boolean'],
            'delegation' => ['sometimes', 'boolean'],
            'ai_assistant' => ['sometimes', 'boolean'],
        ]);

        $incoming = array_intersect_key($validated, array_flip($allowedKeys));

        if (empty($incoming)) {
            return response()->json([
                'data' => AppSetting::globalFeatureFlags(),
            ]);
        }

        $current = AppSetting::globalFeatureFlags();
        $merged = array_merge($current, $incoming);

        AppSetting::set('feature_flags', $merged);

        return response()->json([
            'data' => $merged,
        ]);
    }
}

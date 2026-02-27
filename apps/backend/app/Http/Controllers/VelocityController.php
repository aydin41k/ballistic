<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Resources\VelocityForecastResource;
use App\Models\User;
use App\Services\VelocityForecastingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class VelocityController extends Controller
{
    /**
     * Return a velocity forecast for the authenticated user.
     */
    public function forecast(Request $request, VelocityForecastingService $service): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $forecast = $service->forecast((string) $user->id);

        return (new VelocityForecastResource($forecast))
            ->response()
            ->setStatusCode(200);
    }
}

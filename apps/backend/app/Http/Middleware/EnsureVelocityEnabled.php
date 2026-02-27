<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class EnsureVelocityEnabled
{
    /**
     * Handle an incoming request.
     *
     * Ensures the authenticated user has enabled the velocity feature flag.
     * Returns 404 if the feature is not enabled (to not reveal the endpoint exists).
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            abort(401);
        }

        $flags = $user->feature_flags ?? [];
        $velocityEnabled = $flags['velocity'] ?? false;

        if (! $velocityEnabled) {
            abort(404);
        }

        return $next($request);
    }
}

<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class EnsureAiAssistantEnabled
{
    /**
     * Handle an incoming request.
     *
     * Ensures the authenticated user has enabled the AI assistant feature flag.
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
        $aiEnabled = $flags['ai_assistant'] ?? false;

        if (! $aiEnabled) {
            abort(404);
        }

        return $next($request);
    }
}

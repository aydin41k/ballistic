<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Auth\TokenAbility;
use Closure;
use Illuminate\Http\Request;
use Laravel\Sanctum\PersonalAccessToken;
use Symfony\Component\HttpFoundation\Response;

final class EnsureApiTokenAbility
{
    /**
     * Ensure API routes reject MCP-only tokens.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        $token = $user?->currentAccessToken();

        // Session-authenticated web requests do not carry a personal token.
        if (! $token instanceof PersonalAccessToken) {
            return $next($request);
        }

        if (TokenAbility::hasExplicitAbility($token, TokenAbility::Api) || TokenAbility::isWildcardToken($token)) {
            return $next($request);
        }

        return response()->json([
            'message' => 'Token missing API scope.',
        ], 403);
    }
}

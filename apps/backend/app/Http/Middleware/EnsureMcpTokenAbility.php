<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Auth\TokenAbility;
use Closure;
use Illuminate\Http\Request;
use Laravel\Sanctum\PersonalAccessToken;
use Symfony\Component\HttpFoundation\Response;

final class EnsureMcpTokenAbility
{
    /**
     * Ensure MCP requests use a token with MCP ability.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        $token = $user?->currentAccessToken();

        if (! $token instanceof PersonalAccessToken) {
            return $this->mcpError('Authentication required. Provide a valid MCP Bearer token.', 401);
        }

        if (TokenAbility::hasExplicitAbility($token, TokenAbility::Mcp)) {
            return $next($request);
        }

        if (TokenAbility::isWildcardToken($token) && TokenAbility::isLegacyWildcardAllowedForMcp()) {
            $response = $next($request);
            $response->headers->set('X-Ballistic-MCP-Legacy-Token', 'deprecated');

            return $response;
        }

        return $this->mcpError('Token missing MCP scope. Create a dedicated MCP token.', 403);
    }

    private function mcpError(string $message, int $status): Response
    {
        return response()->json([
            'jsonrpc' => '2.0',
            'id' => null,
            'error' => [
                'code' => -32000,
                'message' => $message,
            ],
        ], $status);
    }
}

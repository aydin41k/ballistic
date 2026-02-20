<?php

declare(strict_types=1);

namespace App\Mcp\Middleware;

use App\Mcp\Services\McpAuthContext;
use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware for MCP requests.
 *
 * This middleware:
 * - Validates that a user is authenticated
 * - Sets up the MCP authentication context
 * - Logs the MCP session start for audit purposes
 */
final class McpAuthMiddleware
{
    public function __construct(
        private readonly McpAuthContext $auth
    ) {}

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Verify authentication
        $user = Auth::user();

        if (! $user instanceof User) {
            return response()->json([
                'jsonrpc' => '2.0',
                'id' => null,
                'error' => [
                    'code' => -32000,
                    'message' => 'Authentication required. Provide a valid Bearer token.',
                ],
            ], 401);
        }

        // Set up MCP auth context
        $this->auth->setUser($user);

        // Log MCP session start
        $this->auth->logAction('session_start', 'mcp_session', null, 'success', [
            'user_agent' => $request->userAgent(),
            'ip_address' => $request->ip(),
        ]);

        return $next($request);
    }
}

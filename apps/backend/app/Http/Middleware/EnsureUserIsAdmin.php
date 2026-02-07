<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

final class EnsureUserIsAdmin
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || ! $user->is_admin) {
            $this->logUnauthorisedAccess($request);

            // For API routes return JSON 403
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json(
                    ['message' => 'Access denied. Admin privileges required.'],
                    Response::HTTP_FORBIDDEN,
                );
            }

            // For web (Inertia) routes abort with 403
            abort(Response::HTTP_FORBIDDEN, 'Access denied. Admin privileges required.');
        }

        return $next($request);
    }

    private function logUnauthorisedAccess(Request $request): void
    {
        $userId = $request->user()?->id ?? 'unauthenticated';

        Log::channel('security')->warning('Unauthorised admin access attempt', [
            'user_id' => $userId,
            'ip' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'uri' => $request->getRequestUri(),
            'method' => $request->method(),
        ]);
    }
}

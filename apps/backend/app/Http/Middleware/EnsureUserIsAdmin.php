<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Models\AuditLog;
use Closure;
use Illuminate\Http\Request;
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
        if (! $request->user() || ! $request->user()->is_admin) {
            // Log unauthorised admin access attempt
            $user = $request->user();
            $metadata = [
                'url' => $request->fullUrl(),
                'method' => $request->method(),
            ];

            // Store user info in metadata for audit trail preservation
            if ($user) {
                $metadata['user_name'] = $user->name;
                $metadata['user_email'] = $user->email;
            }

            AuditLog::create([
                'user_id' => $user?->id,
                'action' => 'admin_access_denied',
                'resource_type' => 'admin_dashboard',
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'status' => 'failed',
                'metadata' => $metadata,
            ]);

            abort(Response::HTTP_FORBIDDEN, 'Access denied. Admin privileges required.');
        }

        return $next($request);
    }
}

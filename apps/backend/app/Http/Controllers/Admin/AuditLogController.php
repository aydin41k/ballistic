<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

final class AuditLogController extends Controller
{
    /**
     * Display a paginated list of audit logs.
     */
    public function __invoke(Request $request): InertiaResponse
    {
        $query = AuditLog::query()
            ->with('user:id,name,email')
            ->when($request->user_id, function (Builder $query, string $userId) {
                $query->where('user_id', $userId);
            })
            ->when($request->action, function (Builder $query, string $action) {
                $query->where('action', $action);
            })
            ->when($request->status, function (Builder $query, string $status) {
                $query->where('status', $status);
            })
            ->when($request->date_from, function (Builder $query, string $dateFrom) {
                $query->where('created_at', '>=', $dateFrom);
            })
            ->when($request->date_to, function (Builder $query, string $dateTo) {
                $query->where('created_at', '<=', $dateTo);
            })
            ->latest();

        $logs = $query->paginate($request->per_page ?? 50)->withQueryString();

        // Get unique actions for filter dropdown
        $actions = AuditLog::distinct()->pluck('action')->sort()->values();

        return Inertia::render('admin/audit-logs/index', [
            'logs' => $logs,
            'filters' => $request->only(['user_id', 'action', 'status', 'date_from', 'date_to']),
            'actions' => $actions,
        ]);
    }
}

<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Item;
use App\Models\Notification;
use App\Models\Project;
use App\Models\Tag;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

final class HealthController extends Controller
{
    /**
     * Display the system health dashboard.
     */
    public function __invoke(Request $request): InertiaResponse
    {
        // Cache stats for 60 seconds to improve performance
        $stats = Cache::remember('admin_health_stats', 60, function () {
            $now = now();
            $oneDayAgo = $now->copy()->subDay();
            $oneWeekAgo = $now->copy()->subWeek();

            return [
                'users' => [
                    'total' => User::count(),
                    'admins' => User::where('is_admin', true)->count(),
                    'verified' => User::whereNotNull('email_verified_at')->count(),
                    'recent' => User::where('created_at', '>=', $oneWeekAgo)->count(),
                    'active_today' => User::whereHas('items', function ($q) use ($oneDayAgo) {
                        $q->where('updated_at', '>=', $oneDayAgo);
                    })->count(),
                ],
                'items' => [
                    'total' => Item::count(),
                    'by_status' => Item::select('status', DB::raw('count(*) as count'))
                        ->groupBy('status')
                        ->pluck('count', 'status')
                        ->toArray(),
                    'overdue' => Item::where('due_date', '<', $now)
                        ->whereNotIn('status', ['done', 'wontdo'])
                        ->count(),
                    'recurring_templates' => Item::whereNotNull('recurrence_rule')
                        ->whereNull('recurrence_parent_id')
                        ->count(),
                    'recent' => Item::where('created_at', '>=', $oneWeekAgo)->count(),
                    'completed_today' => Item::where('status', 'done')
                        ->where('completed_at', '>=', $oneDayAgo)
                        ->count(),
                ],
                'projects' => [
                    'total' => Project::count(),
                    'archived' => Project::whereNotNull('archived_at')->count(),
                    'active' => Project::whereNull('archived_at')->count(),
                ],
                'tags' => [
                    'total' => Tag::count(),
                ],
                'notifications' => [
                    'total' => Notification::count(),
                    'unread' => Notification::whereNull('read_at')->count(),
                    'pending' => Notification::whereNull('read_at')
                        ->where('created_at', '>=', $oneWeekAgo)
                        ->count(),
                ],
                'activity' => [
                    'items_completed_today' => Item::where('status', 'done')
                        ->where('completed_at', '>=', $oneDayAgo)
                        ->count(),
                    'items_completed_this_week' => Item::where('status', 'done')
                        ->where('completed_at', '>=', $oneWeekAgo)
                        ->count(),
                    'items_created_today' => Item::where('created_at', '>=', $oneDayAgo)->count(),
                    'items_created_this_week' => Item::where('created_at', '>=', $oneWeekAgo)->count(),
                ],
            ];
        });

        return Inertia::render('dashboard', [
            'stats' => $stats,
        ]);
    }
}

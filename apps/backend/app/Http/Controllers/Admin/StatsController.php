<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Item;
use App\Models\Project;
use App\Models\Tag;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

final class StatsController extends Controller
{
    /**
     * Display dashboard statistics.
     */
    public function index(): JsonResponse
    {
        $stats = [
            'users' => [
                'total' => User::count(),
                'admins' => User::where('is_admin', true)->count(),
                'verified' => User::whereNotNull('email_verified_at')->count(),
                'recent' => User::where('created_at', '>=', now()->subDays(7))->count(),
            ],
            'items' => [
                'total' => Item::count(),
                'by_status' => [
                    'todo' => Item::where('status', 'todo')->count(),
                    'doing' => Item::where('status', 'doing')->count(),
                    'done' => Item::where('status', 'done')->count(),
                    'wontdo' => Item::where('status', 'wontdo')->count(),
                ],
                'overdue' => Item::whereNotNull('due_date')
                    ->whereDate('due_date', '<', now())
                    ->whereNotIn('status', ['done', 'wontdo'])
                    ->count(),
                'recurring_templates' => Item::whereNotNull('recurrence_rule')
                    ->whereNull('recurrence_parent_id')
                    ->count(),
                'recent' => Item::where('created_at', '>=', now()->subDays(7))->count(),
            ],
            'projects' => [
                'total' => Project::count(),
                'archived' => Project::whereNotNull('archived_at')->count(),
                'active' => Project::whereNull('archived_at')->count(),
            ],
            'tags' => [
                'total' => Tag::count(),
            ],
            'activity' => [
                'items_completed_today' => Item::whereDate('completed_at', today())->count(),
                'items_completed_this_week' => Item::where('completed_at', '>=', now()->startOfWeek())->count(),
                'items_created_today' => Item::whereDate('created_at', today())->count(),
            ],
        ];

        return response()->json($stats);
    }

    /**
     * Get user activity statistics.
     */
    public function userActivity(): JsonResponse
    {
        $topUsers = User::withCount(['items', 'projects'])
            ->orderByDesc('items_count')
            ->limit(10)
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'items_count' => $user->items_count,
                    'projects_count' => $user->projects_count,
                ];
            });

        return response()->json([
            'top_users_by_items' => $topUsers,
        ]);
    }
}

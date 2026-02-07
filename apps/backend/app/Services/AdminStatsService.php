<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Item;
use App\Models\Notification;
use App\Models\Project;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

final class AdminStatsService
{
    private const int CACHE_TTL = 60;

    /**
     * Get the Health Pulse stats, cached for 60 seconds.
     *
     * @return array<string, mixed>
     */
    public function getHealthPulse(): array
    {
        return Cache::remember('admin.health_pulse', self::CACHE_TTL, function (): array {
            return [
                'users' => $this->getUserStats(),
                'content' => $this->getContentStats(),
                'growth' => $this->getGrowthStats(),
                'queue' => $this->getQueueHealth(),
            ];
        });
    }

    /**
     * @return array<string, int>
     */
    private function getUserStats(): array
    {
        return [
            'total' => User::count(),
            'admins' => User::where('is_admin', true)->count(),
            'verified' => User::whereNotNull('email_verified_at')->count(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function getContentStats(): array
    {
        return [
            'active_todos' => Item::whereIn('status', ['todo', 'doing'])->count(),
            'active_lists' => Project::whereNull('archived_at')->count(),
            'total_items' => Item::count(),
            'items_by_status' => [
                'todo' => Item::where('status', 'todo')->count(),
                'doing' => Item::where('status', 'doing')->count(),
                'done' => Item::where('status', 'done')->count(),
                'wontdo' => Item::where('status', 'wontdo')->count(),
            ],
        ];
    }

    /**
     * 24-hour growth metrics.
     *
     * @return array<string, int>
     */
    private function getGrowthStats(): array
    {
        $since = now()->subHours(24);

        return [
            'new_users_24h' => User::where('created_at', '>=', $since)->count(),
            'new_items_24h' => Item::where('created_at', '>=', $since)->count(),
            'completed_items_24h' => Item::where('completed_at', '>=', $since)->count(),
        ];
    }

    /**
     * Notification queue health: pending unread vs failed jobs.
     *
     * @return array<string, int>
     */
    private function getQueueHealth(): array
    {
        $pendingJobs = DB::table('jobs')->count();
        $failedJobs = DB::table('failed_jobs')->count();
        $pendingNotifications = Notification::whereNull('read_at')->count();

        return [
            'pending_jobs' => $pendingJobs,
            'failed_jobs' => $failedJobs,
            'pending_notifications' => $pendingNotifications,
        ];
    }
}

<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DailyStat;
use App\Models\Item;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

final class StatsController extends Controller
{
    /**
     * Get activity statistics for the authenticated user.
     *
     * Query parameters:
     * - period: 'year' (365 days, default) | 'week' (7 days) | 'month' (30 days)
     * - from: date string (optional, overrides period)
     * - to: date string (optional, defaults to today)
     */
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'period' => ['nullable', 'string', 'in:year,month,week'],
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
        ]);

        $userId = (string) Auth::id();
        $period = $validated['period'] ?? 'year';

        // Calculate date range
        $to = isset($validated['to'])
            ? Carbon::parse($validated['to'])
            : Carbon::today();

        if (isset($validated['from'])) {
            $from = Carbon::parse($validated['from']);
        } else {
            $from = match ($period) {
                'week' => $to->copy()->subDays(6),
                'month' => $to->copy()->subDays(29),
                'year' => $to->copy()->subDays(364),
            };
        }

        // Cache key based on user, period, and dates
        $cacheKey = "stats:{$userId}:{$from->toDateString()}:{$to->toDateString()}";
        $cacheTtl = $period === 'week' ? 60 : 300; // 1 min for week, 5 min for longer

        // In testing environment, skip cache to ensure fresh calculations
        if (app()->environment('testing')) {
            $stats = $this->buildStatsResponse($userId, $from, $to);
        } else {
            $stats = Cache::remember($cacheKey, $cacheTtl, function () use ($userId, $from, $to): array {
                return $this->buildStatsResponse($userId, $from, $to);
            });
        }

        return response()->json($stats);
    }

    /**
     * Build the full stats response array.
     */
    private function buildStatsResponse(string $userId, Carbon $from, Carbon $to): array
    {
        // Fetch daily stats for heatmap
        $dailyStats = DailyStat::where('user_id', $userId)
            ->whereBetween('date', [$from->toDateString(), $to->toDateString()])
            ->orderBy('date')
            ->get()
            ->keyBy(fn ($stat) => $stat->date->toDateString());

        // Build heatmap data (fill in missing days with zeros)
        $heatmap = [];
        $current = $from->copy();
        while ($current->lte($to)) {
            $dateStr = $current->toDateString();
            $stat = $dailyStats->get($dateStr);
            $heatmap[] = [
                'date' => $dateStr,
                'completed' => $stat?->completed_count ?? 0,
                'created' => $stat?->created_count ?? 0,
            ];
            $current->addDay();
        }

        // Calculate totals
        $totalCompleted = $dailyStats->sum('completed_count');
        $totalCreated = $dailyStats->sum('created_count');

        // Project distribution (completed items only within the date range)
        $projectDistribution = Item::where('user_id', $userId)
            ->where('status', 'done')
            ->whereNotNull('completed_at')
            ->whereBetween('completed_at', [$from->copy()->startOfDay(), $to->copy()->endOfDay()])
            ->with('project:id,name,color')
            ->get()
            ->groupBy(fn ($item) => $item->project_id ?? 'inbox')
            ->map(function ($items, $projectId) {
                $first = $items->first();

                return [
                    'project_id' => $projectId === 'inbox' ? null : $projectId,
                    'project_name' => $first->project?->name ?? 'Inbox',
                    'project_color' => $first->project?->color ?? '#6b7280', // slate-500
                    'count' => $items->count(),
                ];
            })
            ->sortByDesc('count')
            ->values();

        // Streaks calculation
        $streaks = $this->calculateStreaks($userId, $to);

        return [
            'period' => [
                'from' => $from->toDateString(),
                'to' => $to->toDateString(),
            ],
            'totals' => [
                'completed' => $totalCompleted,
                'created' => $totalCreated,
            ],
            'heatmap' => $heatmap,
            'project_distribution' => $projectDistribution,
            'streaks' => $streaks,
        ];
    }

    /**
     * Calculate current and longest streaks.
     */
    private function calculateStreaks(string $userId, Carbon $endDate): array
    {
        // Get dates with activity for streak calculation
        // Use explicit date string comparison to avoid SQLite timestamp comparison issues
        $endDateStr = $endDate->toDateString();
        $dates = DailyStat::where('user_id', $userId)
            ->where('completed_count', '>', 0)
            ->whereRaw("date(date) <= ?", [$endDateStr])
            ->orderByDesc('date')
            ->pluck('date')
            ->map(fn ($date) => $date->toDateString())
            ->toArray();

        if (empty($dates)) {
            return [
                'current' => 0,
                'longest' => 0,
            ];
        }

        // Calculate current streak (consecutive days ending at or near today)
        $currentStreak = 0;
        $checkDate = $endDate->copy();

        // Check if there's activity today to start the streak
        if (in_array($checkDate->toDateString(), $dates, true)) {
            $currentStreak = 1;
            $checkDate->subDay();

            // Continue counting consecutive days
            while (in_array($checkDate->toDateString(), $dates, true)) {
                $currentStreak++;
                $checkDate->subDay();
            }
        } else {
            // If no activity today, check yesterday to allow for "streak so far today"
            $checkDate->subDay();
            if (in_array($checkDate->toDateString(), $dates, true)) {
                $currentStreak = 1;
                $checkDate->subDay();

                while (in_array($checkDate->toDateString(), $dates, true)) {
                    $currentStreak++;
                    $checkDate->subDay();
                }
            }
        }

        // Calculate longest streak
        $longestStreak = 0;
        $tempStreak = 0;
        $previousDate = null;

        foreach ($dates as $dateStr) {
            if ($previousDate === null) {
                $tempStreak = 1;
            } elseif (Carbon::parse($previousDate)->subDay()->toDateString() === $dateStr) {
                $tempStreak++;
            } else {
                $longestStreak = max($longestStreak, $tempStreak);
                $tempStreak = 1;
            }
            $previousDate = $dateStr;
        }
        $longestStreak = max($longestStreak, $tempStreak);

        return [
            'current' => $currentStreak,
            'longest' => $longestStreak,
        ];
    }
}

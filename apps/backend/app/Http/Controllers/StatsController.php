<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\DailyStat;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

final class StatsController extends Controller
{
    /**
     * Return productivity stats for the authenticated user.
     *
     * Query params:
     *   from  – start date (YYYY-MM-DD), defaults to 364 days ago
     *   to    – end date   (YYYY-MM-DD), defaults to today
     */
    public function index(Request $request): JsonResponse
    {
        $userId = Auth::id();

        $validated = $request->validate([
            'from' => ['sometimes', 'date'],
            'to' => ['sometimes', 'date', 'after_or_equal:from'],
        ]);

        $from = isset($validated['from']) ? Carbon::parse($validated['from']) : Carbon::now()->subDays(364)->startOfDay();
        $to = isset($validated['to']) ? Carbon::parse($validated['to'])->endOfDay() : Carbon::now()->endOfDay();

        $cacheKey = "stats:{$userId}:{$from->toDateString()}:{$to->toDateString()}";

        // Track this cache key for later invalidation (since database driver doesn't support tags)
        $cacheKeysKey = "stats_keys:{$userId}";
        $cachedKeys = Cache::get($cacheKeysKey, []);
        if (! in_array($cacheKey, $cachedKeys, true)) {
            $cachedKeys[] = $cacheKey;
            Cache::put($cacheKeysKey, $cachedKeys, 3600); // 1 hour TTL for the tracking key
        }

        $payload = Cache::remember($cacheKey, 60, function () use ($userId, $from, $to): array {
            // ── Heatmap: one row per day from daily_stats ──────────────────
            $heatmap = DailyStat::where('user_id', $userId)
                ->whereBetween('date', [$from->toDateString(), $to->toDateString()])
                ->orderBy('date')
                ->get(['date', 'completed_count'])
                ->map(fn (DailyStat $s): array => [
                    'date' => $s->date,
                    'completed_count' => $s->completed_count,
                ]);

            // ── Category distribution: completed items grouped by project ──
            $categoryDistribution = DB::table('items')
                ->select(
                    'items.project_id',
                    'projects.name as project_name',
                    'projects.color as project_color',
                    DB::raw('COUNT(*) as completed_count'),
                )
                ->leftJoin('projects', 'items.project_id', '=', 'projects.id')
                ->where('items.user_id', $userId)
                ->where('items.status', 'done')
                ->whereNotNull('items.completed_at')
                ->whereBetween('items.completed_at', [$from->toDateTimeString(), $to->toDateTimeString()])
                ->whereNull('items.deleted_at')
                ->groupBy('items.project_id', 'projects.name', 'projects.color')
                ->orderByDesc('completed_count')
                ->get()
                ->map(fn (object $row): array => [
                    'project_id' => $row->project_id,
                    'project_name' => $row->project_name ?? 'Inbox',
                    'project_color' => $row->project_color,
                    'completed_count' => (int) $row->completed_count,
                ]);

            return [
                'heatmap' => $heatmap,
                'category_distribution' => $categoryDistribution,
            ];
        });

        return response()->json($payload);
    }
}

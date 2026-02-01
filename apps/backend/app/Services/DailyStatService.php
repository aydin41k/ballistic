<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\DailyStat;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;

final class DailyStatService
{
    /**
     * Increment the created_count for a given user on a given date.
     */
    public static function incrementCreated(string $userId, Carbon $date): void
    {
        $stat = DailyStat::firstOrCreate(
            ['user_id' => $userId, 'date' => $date->toDateString()],
            ['created_count' => 0, 'completed_count' => 0],
        );

        $stat->increment('created_count');

        self::invalidateCache($userId);
    }

    /**
     * Increment the completed_count for a given user on a given date.
     */
    public static function incrementCompleted(string $userId, Carbon $date): void
    {
        $stat = DailyStat::firstOrCreate(
            ['user_id' => $userId, 'date' => $date->toDateString()],
            ['created_count' => 0, 'completed_count' => 0],
        );

        $stat->increment('completed_count');

        self::invalidateCache($userId);
    }

    /**
     * Decrement the completed_count, floored at zero.
     */
    public static function decrementCompleted(string $userId, Carbon $date): void
    {
        $stat = DailyStat::firstOrCreate(
            ['user_id' => $userId, 'date' => $date->toDateString()],
            ['created_count' => 0, 'completed_count' => 0],
        );

        if ($stat->completed_count > 0) {
            $stat->decrement('completed_count');
        }

        self::invalidateCache($userId);
    }

    /**
     * Flush all cached stats responses for a user so the next request
     * picks up the freshly mutated daily_stats rows.
     */
    private static function invalidateCache(string $userId): void
    {
        // Since we're using database cache driver which doesn't support tags,
        // we'll use a wildcard-like approach by forgetting specific cache keys.
        // Cache keys follow pattern: stats:{userId}:{startDate}:{endDate}
        // We'll use a cache key to track all stat cache keys for this user.

        $cacheKeysKey = "stats_keys:{$userId}";
        $cachedKeys = Cache::get($cacheKeysKey, []);

        foreach ($cachedKeys as $key) {
            Cache::forget($key);
        }

        // Clear the tracking key itself
        Cache::forget($cacheKeysKey);
    }
}

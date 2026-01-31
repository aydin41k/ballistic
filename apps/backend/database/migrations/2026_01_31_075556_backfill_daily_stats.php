<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Backfill daily_stats from existing items data.
     */
    public function up(): void
    {
        // Backfill created_count from items.created_at
        // Group by user_id and date, count items created on each day
        $createdStats = DB::table('items')
            ->select('user_id', DB::raw('DATE(created_at) as date'), DB::raw('COUNT(*) as count'))
            ->whereNull('deleted_at')
            ->groupBy('user_id', DB::raw('DATE(created_at)'))
            ->get();

        foreach ($createdStats as $stat) {
            DB::table('daily_stats')->upsert(
                [
                    'id' => Str::uuid()->toString(),
                    'user_id' => $stat->user_id,
                    'date' => $stat->date,
                    'created_count' => $stat->count,
                    'completed_count' => 0,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                ['user_id', 'date'],
                ['created_count' => $stat->count, 'updated_at' => now()]
            );
        }

        // Backfill completed_count from items.completed_at
        // Only count items that are currently 'done' and have a completed_at timestamp
        $completedStats = DB::table('items')
            ->select('user_id', DB::raw('DATE(completed_at) as date'), DB::raw('COUNT(*) as count'))
            ->where('status', 'done')
            ->whereNotNull('completed_at')
            ->whereNull('deleted_at')
            ->groupBy('user_id', DB::raw('DATE(completed_at)'))
            ->get();

        foreach ($completedStats as $stat) {
            DB::table('daily_stats')->upsert(
                [
                    'id' => Str::uuid()->toString(),
                    'user_id' => $stat->user_id,
                    'date' => $stat->date,
                    'created_count' => 0,
                    'completed_count' => $stat->count,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                ['user_id', 'date'],
                ['completed_count' => $stat->count, 'updated_at' => now()]
            );
        }
    }

    /**
     * Reverse the migrations.
     * Truncate the daily_stats table.
     */
    public function down(): void
    {
        DB::table('daily_stats')->truncate();
    }
};

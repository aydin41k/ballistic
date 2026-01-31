<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Backfill daily_stats from existing items.
     *
     * Pass 1 – created_count: group all non-deleted items by (user_id, DATE(created_at)).
     * Pass 2 – completed_count: group done items (with completed_at) by (user_id, DATE(completed_at)).
     *
     * Both passes use upsert so the migration is idempotent.
     */
    public function up(): void
    {
        // Pass 1: aggregate created_count
        $createdRows = DB::table('items')
            ->select(
                'user_id',
                DB::raw('DATE(created_at) as stat_date'),
                DB::raw('COUNT(*) as cnt'),
            )
            ->whereNull('deleted_at')
            ->groupBy('user_id', DB::raw('DATE(created_at)'))
            ->get();

        foreach ($createdRows as $row) {
            DB::table('daily_stats')->upsert(
                [['user_id' => $row->user_id, 'date' => $row->stat_date, 'created_count' => $row->cnt, 'completed_count' => 0]],
                ['user_id', 'date'],
                ['created_count'],
            );
        }

        // Pass 2: aggregate completed_count
        $completedRows = DB::table('items')
            ->select(
                'user_id',
                DB::raw('DATE(completed_at) as stat_date'),
                DB::raw('COUNT(*) as cnt'),
            )
            ->where('status', 'done')
            ->whereNotNull('completed_at')
            ->whereNull('deleted_at')
            ->groupBy('user_id', DB::raw('DATE(completed_at)'))
            ->get();

        foreach ($completedRows as $row) {
            DB::table('daily_stats')->upsert(
                [['user_id' => $row->user_id, 'date' => $row->stat_date, 'created_count' => 0, 'completed_count' => $row->cnt]],
                ['user_id', 'date'],
                ['completed_count'],
            );
        }
    }

    /**
     * Truncate is safe here – the table is purely derived data that the observer
     * will rebuild going forward.  Re-running the backfill migration after a
     * rollback will repopulate it.
     */
    public function down(): void
    {
        DB::table('daily_stats')->truncate();
    }
};

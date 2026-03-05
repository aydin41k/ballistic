<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Composite index to serve the "Recent Activity" timeline query:
     *   WHERE user_id = ? AND status IN ('done','wontdo') ORDER BY updated_at DESC
     * A (user_id, status, updated_at) index lets the planner satisfy the filter
     * and the sort from the index alone, avoiding a filesort on large item sets.
     */
    public function up(): void
    {
        Schema::table('items', function (Blueprint $table) {
            $table->index(['user_id', 'status', 'updated_at'], 'items_user_status_updated_idx');
        });
    }

    public function down(): void
    {
        Schema::table('items', function (Blueprint $table) {
            $table->dropIndex('items_user_status_updated_idx');
        });
    }
};

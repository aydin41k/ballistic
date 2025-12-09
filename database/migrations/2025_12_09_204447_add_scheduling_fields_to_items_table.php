<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('items', function (Blueprint $table) {
            $table->date('scheduled_date')->nullable()->after('position');
            $table->date('due_date')->nullable()->after('scheduled_date');
            $table->timestamp('completed_at')->nullable()->after('due_date');

            // Indexes for efficient date-based queries
            $table->index('scheduled_date');
            $table->index('due_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('items', function (Blueprint $table) {
            $table->dropIndex(['scheduled_date']);
            $table->dropIndex(['due_date']);
            $table->dropColumn(['scheduled_date', 'due_date', 'completed_at']);
        });
    }
};

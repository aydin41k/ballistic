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
            $table->string('recurrence_rule')->nullable()->after('completed_at');
            $table->foreignUuid('recurrence_parent_id')->nullable()->after('recurrence_rule')
                ->constrained('items')->nullOnDelete();

            $table->index('recurrence_parent_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('items', function (Blueprint $table) {
            $table->dropForeign(['recurrence_parent_id']);
            $table->dropIndex(['recurrence_parent_id']);
            $table->dropColumn(['recurrence_rule', 'recurrence_parent_id']);
        });
    }
};

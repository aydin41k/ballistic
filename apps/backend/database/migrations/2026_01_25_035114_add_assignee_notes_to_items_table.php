<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Adds a notes field for assignees to add their own notes without
     * modifying the task description set by the owner.
     */
    public function up(): void
    {
        Schema::table('items', function (Blueprint $table) {
            $table->text('assignee_notes')->nullable()->after('description');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('items', function (Blueprint $table) {
            $table->dropColumn('assignee_notes');
        });
    }
};

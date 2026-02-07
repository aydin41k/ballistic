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
        Schema::table('users', function (Blueprint $table) {
            // Indexes for fast admin search and filtering
            // Note: email and phone indexes already exist from previous migrations
            $table->index('is_admin');
            $table->index('created_at');
            $table->index(['is_admin', 'created_at']); // Composite index for admin filtering with sorting
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['is_admin']);
            $table->dropIndex(['created_at']);
            $table->dropIndex(['is_admin', 'created_at']);
        });
    }
};

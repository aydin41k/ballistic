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
     * CRITICAL FIX: Change audit_logs.user_id foreign key from CASCADE to SET NULL
     * to preserve audit trail when users are deleted (compliance requirement).
     */
    public function up(): void
    {
        Schema::table('audit_logs', function (Blueprint $table) {
            // Drop the existing foreign key with CASCADE
            $table->dropForeign(['user_id']);

            // Recreate with SET NULL to preserve audit logs
            $table->foreign('user_id')
                ->references('id')
                ->on('users')
                ->onDelete('set null'); // Preserve audit trail
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('audit_logs', function (Blueprint $table) {
            // Revert to CASCADE (not recommended for audit logs)
            $table->dropForeign(['user_id']);

            $table->foreign('user_id')
                ->references('id')
                ->on('users')
                ->onDelete('cascade');
        });
    }
};

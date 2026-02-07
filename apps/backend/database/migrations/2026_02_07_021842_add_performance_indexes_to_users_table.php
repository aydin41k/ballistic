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
            // Index for search on name (fragment search performance)
            $table->index('name');
            // Index for default sort by created_at desc (admin user listing)
            $table->index('created_at');
            // Index for filtering by admin role
            $table->index('is_admin');
            // Note: phone index already exists from 2026_01_25_122700_add_phone_to_users_table
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['name']);
            $table->dropIndex(['created_at']);
            $table->dropIndex(['is_admin']);
        });
    }
};

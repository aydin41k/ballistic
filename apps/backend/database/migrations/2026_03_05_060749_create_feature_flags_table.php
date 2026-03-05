<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Global, admin-toggled feature flags.
     *
     * These are site-wide switches (unlike users.feature_flags which stores
     * per-user preferences). Reads are served from cache via FeatureFlagService
     * so the DB is only hit when the cache misses or an admin mutates a flag.
     */
    public function up(): void
    {
        Schema::create('feature_flags', function (Blueprint $table) {
            $table->string('key')->primary();
            $table->boolean('enabled')->default(false);
            $table->string('label');
            $table->string('description')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('feature_flags');
    }
};

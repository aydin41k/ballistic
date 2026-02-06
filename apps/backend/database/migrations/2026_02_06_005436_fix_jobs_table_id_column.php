<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * The original migration created the jobs table with a UUID primary key,
     * but Laravel's database queue driver expects a bigint auto-increment id.
     * This migration recreates the jobs table with the correct schema.
     */
    public function up(): void
    {
        // Drop and recreate with correct schema (jobs are transient, safe to drop)
        Schema::dropIfExists('jobs');

        DB::statement('CREATE TABLE jobs (
            id BIGSERIAL PRIMARY KEY,
            queue VARCHAR(255) NOT NULL,
            payload TEXT NOT NULL,
            attempts SMALLINT NOT NULL DEFAULT 0,
            reserved_at INTEGER,
            available_at INTEGER NOT NULL,
            created_at INTEGER NOT NULL
        )');

        DB::statement('CREATE INDEX jobs_queue_index ON jobs (queue)');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('jobs');

        DB::statement('CREATE TABLE jobs (
            id UUID PRIMARY KEY,
            queue VARCHAR(255) NOT NULL,
            payload TEXT NOT NULL,
            attempts SMALLINT NOT NULL DEFAULT 0,
            reserved_at INTEGER,
            available_at INTEGER NOT NULL,
            created_at INTEGER NOT NULL
        )');

        DB::statement('CREATE INDEX jobs_queue_index ON jobs (queue)');
    }
};

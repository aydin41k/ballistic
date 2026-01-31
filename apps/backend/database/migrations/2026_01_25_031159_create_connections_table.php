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
     * Creates a connections table for mutual user connections.
     * Users must be connected before they can assign tasks to each other.
     */
    public function up(): void
    {
        Schema::create('connections', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('requester_id')->constrained('users')->cascadeOnDelete();
            $table->foreignUuid('addressee_id')->constrained('users')->cascadeOnDelete();
            $table->enum('status', ['pending', 'accepted', 'declined'])->default('pending');
            $table->timestamps();

            // Ensure unique connection pairs (one request per direction)
            $table->unique(['requester_id', 'addressee_id']);

            // Index for efficient lookups
            $table->index(['addressee_id', 'status']);
            $table->index(['requester_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('connections');
    }
};

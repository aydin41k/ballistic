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
        Schema::dropIfExists('daily_stats');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::create('daily_stats', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->date('date');
            $table->unsignedInteger('completed_count')->default(0);
            $table->unsignedInteger('created_count')->default(0);
            $table->unique(['user_id', 'date']);
        });
    }
};

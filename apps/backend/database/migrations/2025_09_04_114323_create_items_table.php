<?php

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
        Schema::create('items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained()->onDelete('cascade');
            $table->foreignUuid('project_id')->nullable()->constrained()->onDelete('cascade');
            $table->text('title');
            $table->text('description')->nullable();
            $table->enum('status', ['todo', 'doing', 'done', 'wontdo'])->default('todo');
            $table->integer('position')->default(0);
            $table->softDeletes();
            $table->timestamps();

            // Index for efficient querying by project and status
            $table->index(['project_id', 'status', 'position']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('items');
    }
};

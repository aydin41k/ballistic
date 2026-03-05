<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Adds:
     *  - users.avatar_path — storage-relative path to the uploaded profile
     *    image (public disk).
     *  - project_user_exclusions — pivot table recording which projects a user
     *    has hidden from their main feed. Using a real pivot (rather than a
     *    JSON column) gives us referential integrity: when a project is
     *    deleted, its exclusion rows disappear automatically and the
     *    relationship can be queried with Eloquent's belongsToMany.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('avatar_path')->nullable()->after('notes');
        });

        Schema::create('project_user_exclusions', function (Blueprint $table) {
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('project_id')->constrained()->cascadeOnDelete();
            $table->timestamps();

            $table->primary(['user_id', 'project_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('project_user_exclusions');

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('avatar_path');
        });
    }
};

<?php

declare(strict_types=1);

namespace Tests\Feature\Api;

use App\Auth\TokenAbility;
use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

final class UserProfileTest extends TestCase
{
    use RefreshDatabase;

    // --- Excluded projects (pivot) ----------------------------------------

    public function test_user_can_sync_excluded_projects(): void
    {
        $user = User::factory()->create();
        $projects = Project::factory()->for($user)->count(3)->create();
        $excludeIds = [(string) $projects[0]->id, (string) $projects[1]->id];

        $response = $this->actingAs($user)->patchJson('/api/user', [
            'excluded_project_ids' => $excludeIds,
        ]);

        $response->assertOk();
        $this->assertEqualsCanonicalizing(
            $excludeIds,
            $response->json('data.excluded_project_ids')
        );
        $this->assertDatabaseCount('project_user_exclusions', 2);
    }

    public function test_sync_removes_projects_not_in_payload(): void
    {
        $user = User::factory()->create();
        $p1 = Project::factory()->for($user)->create();
        $p2 = Project::factory()->for($user)->create();
        $this->attachExclusions($user, $p1, $p2);

        $this->actingAs($user)->patchJson('/api/user', [
            'excluded_project_ids' => [(string) $p1->id],
        ])->assertOk();

        $this->assertDatabaseHas('project_user_exclusions', ['project_id' => (string) $p1->id]);
        $this->assertDatabaseMissing('project_user_exclusions', ['project_id' => (string) $p2->id]);
    }

    public function test_sync_with_empty_array_clears_all_exclusions(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->for($user)->create();
        $this->attachExclusions($user, $project);

        $this->actingAs($user)->patchJson('/api/user', [
            'excluded_project_ids' => [],
        ])->assertOk();

        $this->assertDatabaseCount('project_user_exclusions', 0);
    }

    public function test_omitting_excluded_project_ids_leaves_pivot_unchanged(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->for($user)->create();
        $this->attachExclusions($user, $project);

        // Update only the name — exclusions must survive.
        $this->actingAs($user)->patchJson('/api/user', ['name' => 'New Name'])->assertOk();

        $this->assertDatabaseHas('project_user_exclusions', [
            'user_id' => (string) $user->id,
            'project_id' => (string) $project->id,
        ]);
    }

    public function test_user_cannot_exclude_another_users_project(): void
    {
        $me = User::factory()->create();
        $other = User::factory()->create();
        $foreign = Project::factory()->for($other)->create();

        $response = $this->actingAs($me)->patchJson('/api/user', [
            'excluded_project_ids' => [$foreign->id],
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors('excluded_project_ids.0');
        $this->assertDatabaseCount('project_user_exclusions', 0);
    }

    public function test_excluded_project_ids_returned_on_show(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->for($user)->create();
        $this->attachExclusions($user, $project);

        $response = $this->actingAs($user)->getJson('/api/user');

        $response->assertOk()
            ->assertJsonPath('data.excluded_project_ids', [(string) $project->id]);
    }

    // --- Avatar upload -----------------------------------------------------

    public function test_user_can_upload_avatar(): void
    {
        Storage::fake('public');
        $user = User::factory()->create();

        $file = UploadedFile::fake()->image('avatar.png', 200, 200);

        $response = $this->actingAs($user)->patch('/api/user', ['avatar' => $file]);

        $response->assertOk();
        $user->refresh();
        $this->assertNotNull($user->avatar_path);
        Storage::disk('public')->assertExists($user->avatar_path);
        $this->assertNotNull($response->json('data.avatar_url'));
    }

    public function test_avatar_rejects_oversize_file(): void
    {
        Storage::fake('public');
        $user = User::factory()->create();

        // 3 MB > 2 MB limit.
        $file = UploadedFile::fake()->image('huge.png')->size(3072);

        $this->actingAs($user)
            ->patch('/api/user', ['avatar' => $file])
            ->assertSessionHasErrors('avatar');

        $this->assertNull($user->refresh()->avatar_path);
    }

    public function test_avatar_rejects_non_image(): void
    {
        Storage::fake('public');
        $user = User::factory()->create();

        $file = UploadedFile::fake()->create('not-an-image.pdf', 100, 'application/pdf');

        $this->actingAs($user)
            ->patch('/api/user', ['avatar' => $file])
            ->assertSessionHasErrors('avatar');
    }

    public function test_new_avatar_replaces_old_file(): void
    {
        Storage::fake('public');
        $user = User::factory()->create();

        $first = UploadedFile::fake()->image('one.png', 100, 100);
        $this->actingAs($user)->patch('/api/user', ['avatar' => $first])->assertOk();
        $oldPath = $user->refresh()->avatar_path;
        Storage::disk('public')->assertExists($oldPath);

        $second = UploadedFile::fake()->image('two.png', 100, 100);
        $this->actingAs($user)->patch('/api/user', ['avatar' => $second])->assertOk();
        $newPath = $user->refresh()->avatar_path;

        $this->assertNotSame($oldPath, $newPath);
        Storage::disk('public')->assertExists($newPath);
        Storage::disk('public')->assertMissing($oldPath);
    }

    // --- Unique email / basic profile --------------------------------------

    public function test_email_update_enforces_uniqueness(): void
    {
        $userA = User::factory()->create(['email' => 'a@example.com']);
        User::factory()->create(['email' => 'b@example.com']);

        $this->actingAs($userA)
            ->patchJson('/api/user', ['email' => 'b@example.com'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('email');
    }

    public function test_email_update_resets_verification(): void
    {
        $user = User::factory()->create(['email_verified_at' => now()]);
        $token = $user->createToken('api-client', [TokenAbility::Api->value])->plainTextToken;

        $this->withToken($token)
            ->patchJson('/api/user', ['email' => 'newemail@example.com'])
            ->assertOk();

        $this->assertNull($user->refresh()->email_verified_at);
    }

    public function test_name_update_works_standalone(): void
    {
        $user = User::factory()->create(['name' => 'Old']);

        $this->actingAs($user)
            ->patchJson('/api/user', ['name' => 'New Name'])
            ->assertOk()
            ->assertJsonPath('data.name', 'New Name');
    }

    /**
     * Attach projects to a user's exclusion pivot.
     *
     * Project::creating() assigns Str::uuid(), which returns a
     * Ramsey\Uuid\Lazy\LazyUuidFromString object. Eloquent's pivot attach()
     * uses IDs as PHP array keys (InteractsWithPivotTable.php), and PHP won't
     * auto-cast objects to strings for array keys — so we cast explicitly
     * here. The production code path receives string UUIDs from the validated
     * JSON body and is unaffected.
     */
    private function attachExclusions(User $user, Project ...$projects): void
    {
        $user->excludedProjects()->attach(
            array_map(static fn (Project $p): string => (string) $p->id, $projects)
        );
    }
}

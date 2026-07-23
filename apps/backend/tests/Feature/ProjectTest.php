<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Support\Str;
use Tests\TestCase;

class ProjectTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    public function test_can_create_project(): void
    {
        $user = User::factory()->create();

        $projectData = [
            'user_id' => $user->id,
            'name' => 'Test Project',
            'color' => '#FF5733',
        ];

        $project = Project::create($projectData);

        $this->assertDatabaseHas('projects', [
            'id' => $project->id,
            'user_id' => $user->id,
            'name' => 'Test Project',
            'color' => '#FF5733',
        ]);
    }

    public function test_offline_project_create_can_be_replayed_safely(): void
    {
        $user = User::factory()->create();
        $projectId = (string) Str::uuid();
        $payload = [
            'id' => $projectId,
            'name' => 'Offline project',
            'color' => '#2563EB',
        ];

        $this->actingAs($user)->postJson('/api/projects', $payload)
            ->assertCreated()
            ->assertJsonPath('data.id', $projectId);

        $this->actingAs($user)->postJson('/api/projects', $payload)
            ->assertOk()
            ->assertJsonPath('data.id', $projectId);

        $this->assertDatabaseCount('projects', 1);
        $this->assertDatabaseHas('projects', [
            'id' => $projectId,
            'user_id' => $user->id,
            'name' => 'Offline project',
        ]);
    }

    public function test_user_cannot_claim_another_users_offline_project_identifier(): void
    {
        $owner = User::factory()->create();
        $otherUser = User::factory()->create();
        $project = Project::factory()->create(['user_id' => $owner->id]);

        $this->actingAs($otherUser)->postJson('/api/projects', [
            'id' => $project->id,
            'name' => 'Identifier collision',
        ])->assertConflict();

        $this->assertDatabaseHas('projects', [
            'id' => $project->id,
            'user_id' => $owner->id,
        ]);
    }

    public function test_project_belongs_to_user(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create(['user_id' => $user->id]);

        $this->assertInstanceOf(User::class, $project->user);
        $this->assertEquals($user->id, $project->user->id);
    }

    public function test_can_archive_project(): void
    {
        $project = Project::factory()->create();

        $this->assertNull($project->archived_at);

        $project->update(['archived_at' => now()]);

        $this->assertNotNull($project->fresh()->archived_at);
    }

    public function test_can_restore_archived_project(): void
    {
        $project = Project::factory()->create(['archived_at' => now()]);

        $this->assertNotNull($project->archived_at);

        $project->update(['archived_at' => null]);

        $this->assertNull($project->fresh()->archived_at);
    }

    public function test_project_uses_uuid_as_primary_key(): void
    {
        $project = Project::factory()->create();

        $this->assertNotNull($project->id);
        $this->assertEquals(36, strlen((string) $project->id)); // UUID length
    }

    public function test_project_factory_creates_valid_data(): void
    {
        $project = Project::factory()->create();

        $this->assertNotEmpty($project->name);
        $this->assertInstanceOf(User::class, $project->user);
        $this->assertNotNull($project->id);
    }
}

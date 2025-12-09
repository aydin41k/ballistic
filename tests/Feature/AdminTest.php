<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Item;
use App\Models\Project;
use App\Models\Tag;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class AdminTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_access_admin_routes(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin)
            ->getJson('/api/admin/stats');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'users' => ['total', 'admins', 'verified', 'recent'],
                'items' => ['total', 'by_status', 'overdue', 'recurring_templates', 'recent'],
                'projects' => ['total', 'archived', 'active'],
                'tags' => ['total'],
                'activity',
            ]);
    }

    public function test_non_admin_cannot_access_admin_routes(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->getJson('/api/admin/stats');

        $response->assertStatus(403);
    }

    public function test_admin_can_list_users(): void
    {
        $admin = User::factory()->admin()->create();
        User::factory()->count(5)->create();

        $response = $this->actingAs($admin)
            ->getJson('/api/admin/users');

        $response->assertStatus(200)
            ->assertJsonCount(6, 'data'); // 5 users + admin
    }

    public function test_admin_can_search_users(): void
    {
        $admin = User::factory()->admin()->create();
        $searchUser = User::factory()->create(['name' => 'Specific Name']);
        User::factory()->count(5)->create();

        $response = $this->actingAs($admin)
            ->getJson('/api/admin/users?search=Specific');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Specific Name');
    }

    public function test_admin_can_create_user(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin)
            ->postJson('/api/admin/users', [
                'name' => 'New User',
                'email' => 'newuser@example.com',
                'password' => 'password123',
                'password_confirmation' => 'password123',
                'is_admin' => false,
            ]);

        $response->assertStatus(201)
            ->assertJsonFragment([
                'name' => 'New User',
                'email' => 'newuser@example.com',
            ]);

        $this->assertDatabaseHas('users', [
            'email' => 'newuser@example.com',
        ]);
    }

    public function test_admin_can_update_user(): void
    {
        $admin = User::factory()->admin()->create();
        $user = User::factory()->create();

        $response = $this->actingAs($admin)
            ->putJson("/api/admin/users/{$user->id}", [
                'name' => 'Updated Name',
                'is_admin' => true,
            ]);

        $response->assertStatus(200)
            ->assertJsonFragment([
                'name' => 'Updated Name',
                'is_admin' => true,
            ]);
    }

    public function test_admin_can_delete_user(): void
    {
        $admin = User::factory()->admin()->create();
        $user = User::factory()->create();

        $response = $this->actingAs($admin)
            ->deleteJson("/api/admin/users/{$user->id}");

        $response->assertStatus(204);

        $this->assertDatabaseMissing('users', [
            'id' => $user->id,
        ]);
    }

    public function test_admin_cannot_delete_self(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin)
            ->deleteJson("/api/admin/users/{$admin->id}");

        $response->assertStatus(403);
    }

    public function test_admin_stats_show_correct_counts(): void
    {
        $admin = User::factory()->admin()->create();
        
        // Create users with specific projects
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        
        // Create projects for user1
        $project1 = Project::factory()->create(['user_id' => $user1->id]);
        $project2 = Project::factory()->create(['user_id' => $user2->id]);
        
        // Create items with specific users/projects
        Item::factory()->count(5)->todo()->create(['user_id' => $user1->id, 'project_id' => $project1->id]);
        Item::factory()->count(3)->done()->create(['user_id' => $user2->id, 'project_id' => $project2->id]);

        $response = $this->actingAs($admin)
            ->getJson('/api/admin/stats');

        $response->assertStatus(200)
            ->assertJsonPath('users.total', 3) // 2 users + admin
            ->assertJsonPath('users.admins', 1)
            ->assertJsonPath('projects.total', 2)
            ->assertJsonPath('items.total', 8);
    }
}

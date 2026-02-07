<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Item;
use App\Models\Notification;
use App\Models\Project;
use App\Models\Tag;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class AdminWebTest extends TestCase
{
    use RefreshDatabase;

    // =========================================================
    // Access Control
    // =========================================================

    public function test_guest_is_redirected_from_admin_dashboard(): void
    {
        $this->get('/admin')->assertRedirect('/login');
    }

    public function test_non_admin_cannot_access_admin_dashboard(): void
    {
        $user = User::factory()->create(['is_admin' => false]);

        $this->actingAs($user)->get('/admin')->assertForbidden();
    }

    public function test_admin_can_access_admin_dashboard(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)->get('/admin')->assertOk();
    }

    public function test_non_admin_cannot_access_admin_users_index(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->get('/admin/users')->assertForbidden();
    }

    public function test_admin_can_access_admin_users_index(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)->get('/admin/users')->assertOk();
    }

    public function test_sanctum_token_cannot_access_web_admin_routes(): void
    {
        $admin = User::factory()->admin()->create();
        $token = $admin->createToken('test')->plainTextToken;

        // Hit a web admin route with just the token header (no session)
        $response = $this->withToken($token)->get('/admin');

        // Web routes use 'auth' (session) middleware; token-only → redirect to login
        $response->assertRedirect('/login');
    }

    // =========================================================
    // Search and Pagination
    // =========================================================

    public function test_admin_can_search_users_by_email_fragment(): void
    {
        $admin = User::factory()->admin()->create();
        User::factory()->create(['email' => 'specific.user@example.com', 'name' => 'Specific User']);
        User::factory()->count(5)->create();

        $response = $this->actingAs($admin)->get('/admin/users?search=specific.user');

        $response->assertOk()
            ->assertInertia(
                fn ($page) => $page
                    ->component('admin/users/index')
                    ->has('users.data', 1)
                    ->where('users.data.0.email', 'specific.user@example.com'),
            );
    }

    public function test_admin_can_search_users_by_phone_fragment(): void
    {
        $admin = User::factory()->admin()->create();
        User::factory()->create(['phone' => '+61400123456']);
        User::factory()->count(5)->create();

        $response = $this->actingAs($admin)->get('/admin/users?search=61400');

        $response->assertOk()
            ->assertInertia(
                fn ($page) => $page
                    ->component('admin/users/index')
                    ->has('users.data', 1),
            );
    }

    public function test_search_shorter_than_two_chars_returns_all_users(): void
    {
        $admin = User::factory()->admin()->create();
        User::factory()->count(3)->create();

        // Single char search should return all users (no filter)
        $response = $this->actingAs($admin)->get('/admin/users?search=a');
        $response->assertOk()
            ->assertInertia(fn ($page) => $page->has('users.data', 4)); // 3 + admin
    }

    public function test_admin_can_filter_users_by_role(): void
    {
        $admin = User::factory()->admin()->create();
        User::factory()->count(3)->create(['is_admin' => false]);

        $response = $this->actingAs($admin)->get('/admin/users?role=admin');

        $response->assertOk()
            ->assertInertia(fn ($page) => $page->has('users.data', 1));
    }

    public function test_users_paginate_at_25_per_page(): void
    {
        $admin = User::factory()->admin()->create();
        User::factory()->count(30)->create();

        $response = $this->actingAs($admin)->get('/admin/users');

        $response->assertOk()
            ->assertInertia(
                fn ($page) => $page
                    ->component('admin/users/index')
                    ->where('users.per_page', 25)
                    ->where('users.total', 31),
            );
    }

    // =========================================================
    // User Detail / Collaboration History
    // =========================================================

    public function test_admin_can_view_user_collaboration_history(): void
    {
        $admin = User::factory()->admin()->create();
        $user = User::factory()->create();
        $other = User::factory()->create();

        $project = Project::factory()->create(['user_id' => $other->id]);
        Item::factory()->create([
            'user_id' => $other->id,
            'assignee_id' => $user->id,
            'project_id' => $project->id,
            'title' => 'Assigned Task',
        ]);

        $project2 = Project::factory()->create(['user_id' => $user->id]);
        Item::factory()->create([
            'user_id' => $user->id,
            'assignee_id' => $other->id,
            'project_id' => $project2->id,
            'title' => 'Delegated Task',
        ]);

        $response = $this->actingAs($admin)->get("/admin/users/{$user->id}");

        $response->assertOk()
            ->assertInertia(
                fn ($page) => $page
                    ->component('admin/users/show')
                    ->has('assigned_items', 1)
                    ->has('delegated_items', 1)
                    ->where('assigned_items.0.title', 'Assigned Task')
                    ->where('delegated_items.0.title', 'Delegated Task'),
            );
    }

    // =========================================================
    // Hard Reset
    // =========================================================

    public function test_admin_can_hard_reset_user_data(): void
    {
        $admin = User::factory()->admin()->create();
        $user = User::factory()->create();

        $project = Project::factory()->create(['user_id' => $user->id]);
        Item::factory()->count(5)->create(['user_id' => $user->id, 'project_id' => $project->id]);
        Tag::factory()->count(3)->create(['user_id' => $user->id]);
        Notification::factory()->count(2)->create(['user_id' => $user->id, 'type' => 'task_assigned', 'title' => 'T', 'message' => 'M']);

        $this->actingAs($admin)
            ->post("/admin/users/{$user->id}/hard-reset")
            ->assertRedirect();

        $this->assertDatabaseCount('items', 0);
        $this->assertDatabaseCount('projects', 0);
        $this->assertDatabaseMissing('tags', ['user_id' => $user->id]);
        $this->assertDatabaseMissing('notifications', ['user_id' => $user->id]);

        // User account still exists
        $this->assertDatabaseHas('users', ['id' => $user->id]);
    }

    public function test_admin_cannot_hard_reset_own_account(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)
            ->post("/admin/users/{$admin->id}/hard-reset")
            ->assertRedirect()
            ->assertSessionHasErrors('hard_reset');
    }

    // =========================================================
    // Role Toggle
    // =========================================================

    public function test_admin_can_promote_user_to_admin(): void
    {
        $admin = User::factory()->admin()->create();
        $user = User::factory()->create(['is_admin' => false]);

        $this->actingAs($admin)
            ->patch("/admin/users/{$user->id}", ['is_admin' => true])
            ->assertRedirect();

        $this->assertDatabaseHas('users', ['id' => $user->id, 'is_admin' => true]);
    }

    public function test_admin_cannot_demote_themselves(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)
            ->patch("/admin/users/{$admin->id}", ['is_admin' => false])
            ->assertRedirect()
            ->assertSessionHasErrors('is_admin');
    }

    // =========================================================
    // Dashboard stats
    // =========================================================

    public function test_health_pulse_returns_correct_stats(): void
    {
        $admin = User::factory()->admin()->create();
        $user = User::factory()->create();
        $project = Project::factory()->create(['user_id' => $user->id]);
        Item::factory()->count(3)->todo()->create(['user_id' => $user->id, 'project_id' => $project->id]);
        Item::factory()->count(2)->done()->create(['user_id' => $user->id, 'project_id' => $project->id]);

        $response = $this->actingAs($admin)->get('/admin');

        $response->assertOk()
            ->assertInertia(
                fn ($page) => $page
                    ->component('admin/dashboard')
                    ->where('stats.users.total', 2)
                    ->where('stats.content.active_todos', 3)
                    ->where('stats.content.items_by_status.todo', 3)
                    ->where('stats.content.items_by_status.done', 2),
            );
    }
}

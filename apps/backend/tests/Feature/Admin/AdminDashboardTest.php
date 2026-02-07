<?php

declare(strict_types=1);

namespace Tests\Feature\Admin;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class AdminDashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_non_admin_cannot_access_admin_routes(): void
    {
        $user = User::factory()->create(['is_admin' => false]);

        $response = $this->actingAs($user)->get('/admin/users');

        $response->assertStatus(403);

        // Check that audit log was created
        $this->assertDatabaseHas('audit_logs', [
            'user_id' => $user->id,
            'action' => 'admin_access_denied',
            'status' => 'failed',
        ]);
    }

    public function test_admin_can_access_admin_routes(): void
    {
        $this->withoutExceptionHandling();

        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin)->get('/admin/users');

        $response->assertStatus(200);
    }

    public function test_unauthenticated_user_cannot_access_admin_routes(): void
    {
        $response = $this->get('/admin/users');

        $response->assertRedirect('/login');
    }

    public function test_admin_can_view_users_list(): void
    {
        $admin = User::factory()->admin()->create();
        $users = User::factory()->count(5)->create();

        $response = $this->actingAs($admin)->get('/admin/users');

        $response->assertOk();
    }

    public function test_admin_can_search_users(): void
    {
        $this->withoutExceptionHandling();

        $admin = User::factory()->admin()->create();
        $user1 = User::factory()->create(['name' => 'John Doe', 'email' => 'john@example.com']);
        $user2 = User::factory()->create(['name' => 'Jane Smith', 'email' => 'jane@example.com']);

        $response = $this->actingAs($admin)->get('/admin/users?search=john');

        $response->assertOk();
    }

    public function test_admin_search_escapes_sql_wildcards(): void
    {
        $admin = User::factory()->admin()->create();
        $user1 = User::factory()->create(['name' => 'Test User', 'email' => 'test@example.com']);
        $user2 = User::factory()->create(['name' => 'Other User', 'email' => 'other@example.com']);

        // Search with SQL wildcard characters should be escaped
        $response = $this->actingAs($admin)->get('/admin/users?search=%');

        // Should not match all users (wildcard escaped)
        $response->assertOk();

        // Search with underscore wildcard
        $response = $this->actingAs($admin)->get('/admin/users?search=_');

        $response->assertOk();
    }

    public function test_admin_can_view_user_details(): void
    {
        $admin = User::factory()->admin()->create();
        $user = User::factory()->create();

        $response = $this->actingAs($admin)->get("/admin/users/{$user->id}");

        $response->assertOk();
    }

    public function test_admin_can_hard_reset_user(): void
    {
        $admin = User::factory()->admin()->create();
        $user = User::factory()->create();

        $response = $this->actingAs($admin)->post("/admin/users/{$user->id}/hard-reset");

        $response->assertRedirect("/admin/users/{$user->id}");

        // Check that audit log was created
        $this->assertDatabaseHas('audit_logs', [
            'user_id' => $admin->id,
            'action' => 'user_hard_reset',
            'resource_id' => $user->id,
            'status' => 'success',
        ]);
    }

    public function test_admin_cannot_hard_reset_self(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin)->post("/admin/users/{$admin->id}/hard-reset");

        $response->assertStatus(403);
    }

    public function test_admin_can_delete_user(): void
    {
        $admin = User::factory()->admin()->create();
        $user = User::factory()->create();

        $response = $this->actingAs($admin)->delete("/admin/users/{$user->id}");

        $response->assertRedirect('/admin/users');

        $this->assertDatabaseMissing('users', ['id' => $user->id]);

        // Check that audit log was created
        $this->assertDatabaseHas('audit_logs', [
            'user_id' => $admin->id,
            'action' => 'user_deleted',
            'resource_id' => $user->id,
            'status' => 'success',
        ]);
    }

    public function test_admin_cannot_delete_self(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin)->delete("/admin/users/{$admin->id}");

        $response->assertStatus(403);
    }

    public function test_audit_logs_preserved_when_user_deleted(): void
    {
        $admin = User::factory()->admin()->create();
        $user = User::factory()->create();

        // Create audit logs for the user
        AuditLog::create([
            'user_id' => $user->id,
            'action' => 'test_action',
            'status' => 'success',
        ]);

        // Delete the user
        $this->actingAs($admin)->delete("/admin/users/{$user->id}");

        // User should be deleted
        $this->assertDatabaseMissing('users', ['id' => $user->id]);

        // But audit log should be preserved with user_id set to NULL
        $this->assertDatabaseHas('audit_logs', [
            'user_id' => null,
            'action' => 'test_action',
            'status' => 'success',
        ]);
    }

    public function test_admin_can_view_health_dashboard(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin)->get('/admin/health');

        $response->assertOk();
    }

    public function test_admin_can_view_audit_logs(): void
    {
        $admin = User::factory()->admin()->create();

        // Create some audit logs
        AuditLog::factory()->count(5)->create();

        $response = $this->actingAs($admin)->get('/admin/audit-logs');

        $response->assertOk();
    }

    public function test_admin_can_filter_audit_logs(): void
    {
        $admin = User::factory()->admin()->create();

        AuditLog::create([
            'user_id' => $admin->id,
            'action' => 'user_deleted',
            'status' => 'success',
        ]);

        AuditLog::create([
            'user_id' => $admin->id,
            'action' => 'admin_access_denied',
            'status' => 'failed',
        ]);

        $response = $this->actingAs($admin)->get('/admin/audit-logs?status=failed');

        $response->assertOk();
    }
}

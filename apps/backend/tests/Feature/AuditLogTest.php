<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\Item;
use App\Models\Project;
use App\Models\Tag;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

final class AuditLogTest extends TestCase
{
    use RefreshDatabase;

    // -----------------------------------------------------------------------
    // Creation via HTTP actions
    // -----------------------------------------------------------------------

    public function test_hard_reset_creates_audit_log_entry(): void
    {
        $admin = User::factory()->admin()->create();
        $user = User::factory()->create();

        Project::factory()->create(['user_id' => $user->id]);
        Item::factory()->count(3)->create(['user_id' => $user->id]);
        Tag::factory()->count(2)->create(['user_id' => $user->id]);

        $this->actingAs($admin)
            ->post("/admin/users/{$user->id}/hard-reset")
            ->assertRedirect();

        $this->assertDatabaseHas('audit_logs', [
            'admin_id' => (string) $admin->getKey(),
            'action' => 'user.hard_reset',
            'subject_type' => 'user',
            'subject_id' => (string) $user->getKey(),
        ]);

        $log = AuditLog::where('action', 'user.hard_reset')->first();
        $this->assertNotNull($log);
        $this->assertArrayHasKey('items_count', $log->old_values);
        $this->assertArrayHasKey('projects_count', $log->old_values);
        $this->assertNull($log->new_values);
    }

    public function test_role_change_creates_audit_log_entry(): void
    {
        $admin = User::factory()->admin()->create();
        $user = User::factory()->create(['is_admin' => false]);

        $this->actingAs($admin)
            ->patch("/admin/users/{$user->id}", ['is_admin' => true])
            ->assertRedirect();

        $this->assertDatabaseHas('audit_logs', [
            'admin_id' => (string) $admin->getKey(),
            'action' => 'user.role_changed',
            'subject_type' => 'user',
            'subject_id' => (string) $user->getKey(),
        ]);

        $log = AuditLog::where('action', 'user.role_changed')->first();
        $this->assertNotNull($log);
        $this->assertEquals(['is_admin' => false], $log->old_values);
        $this->assertEquals(['is_admin' => true], $log->new_values);
    }

    public function test_profile_update_creates_audit_log_entry(): void
    {
        $admin = User::factory()->admin()->create();
        $user = User::factory()->create(['name' => 'Old Name']);

        $this->actingAs($admin)
            ->patch("/admin/users/{$user->id}", ['name' => 'New Name'])
            ->assertRedirect();

        $this->assertDatabaseHas('audit_logs', [
            'admin_id' => (string) $admin->getKey(),
            'action' => 'user.profile_updated',
            'subject_type' => 'user',
            'subject_id' => (string) $user->getKey(),
        ]);

        $log = AuditLog::where('action', 'user.profile_updated')->first();
        $this->assertNotNull($log);
        $this->assertEquals(['name' => 'Old Name'], $log->old_values);
        $this->assertEquals(['name' => 'New Name'], $log->new_values);
    }

    public function test_multiple_audit_logs_are_recorded_for_multiple_actions(): void
    {
        $admin = User::factory()->admin()->create();
        $user = User::factory()->create(['is_admin' => false]);

        $this->actingAs($admin)->patch("/admin/users/{$user->id}", ['is_admin' => true]);
        $this->actingAs($admin)->patch("/admin/users/{$user->id}", ['name' => 'Updated']);

        $this->assertDatabaseCount('audit_logs', 2);
    }

    // -----------------------------------------------------------------------
    // Timestamp correctness
    // -----------------------------------------------------------------------

    public function test_created_at_is_populated_automatically(): void
    {
        $admin = User::factory()->admin()->create();
        $user = User::factory()->create();

        $before = Carbon::now()->subSecond();

        $this->actingAs($admin)
            ->post("/admin/users/{$user->id}/hard-reset")
            ->assertRedirect();

        $after = Carbon::now()->addSecond();

        $log = AuditLog::where('action', 'user.hard_reset')->first();
        $this->assertNotNull($log->created_at);
        $this->assertInstanceOf(Carbon::class, $log->created_at);
        $this->assertTrue($log->created_at->between($before, $after));
    }

    public function test_created_at_is_in_utc(): void
    {
        $admin = User::factory()->admin()->create();
        $user = User::factory()->create();

        $this->actingAs($admin)
            ->post("/admin/users/{$user->id}/hard-reset")
            ->assertRedirect();

        $log = AuditLog::where('action', 'user.hard_reset')->first();
        $this->assertEquals('UTC', $log->created_at->timezone->getName());
    }

    public function test_audit_log_has_no_updated_at(): void
    {
        $admin = User::factory()->admin()->create();
        $user = User::factory()->create();

        $this->actingAs($admin)
            ->post("/admin/users/{$user->id}/hard-reset")
            ->assertRedirect();

        $log = AuditLog::where('action', 'user.hard_reset')->first();

        // The model exposes no updated_at and the column does not exist
        $this->assertArrayNotHasKey('updated_at', $log->getAttributes());
        $this->assertNull(AuditLog::UPDATED_AT);
    }

    // -----------------------------------------------------------------------
    // Single-write guarantee (IP / UA recorded in the INSERT, not a follow-up UPDATE)
    // -----------------------------------------------------------------------

    public function test_ip_address_recorded_on_hard_reset(): void
    {
        $admin = User::factory()->admin()->create();
        $user = User::factory()->create();

        $this->actingAs($admin)
            ->post("/admin/users/{$user->id}/hard-reset", [], ['REMOTE_ADDR' => '1.2.3.4'])
            ->assertRedirect();

        $log = AuditLog::where('action', 'user.hard_reset')->first();
        $this->assertEquals('1.2.3.4', $log->ip_address);
    }

    public function test_ip_address_recorded_on_role_change(): void
    {
        $admin = User::factory()->admin()->create();
        $user = User::factory()->create(['is_admin' => false]);

        $this->actingAs($admin)
            ->patch("/admin/users/{$user->id}", ['is_admin' => true], ['REMOTE_ADDR' => '9.8.7.6'])
            ->assertRedirect();

        $log = AuditLog::where('action', 'user.role_changed')->first();
        $this->assertEquals('9.8.7.6', $log->ip_address);
    }

    public function test_ip_address_recorded_on_profile_update(): void
    {
        $admin = User::factory()->admin()->create();
        $user = User::factory()->create(['name' => 'Old']);

        $this->actingAs($admin)
            ->patch("/admin/users/{$user->id}", ['name' => 'New'], ['REMOTE_ADDR' => '10.0.0.1'])
            ->assertRedirect();

        $log = AuditLog::where('action', 'user.profile_updated')->first();
        $this->assertEquals('10.0.0.1', $log->ip_address);
    }

    // -----------------------------------------------------------------------
    // Factory usage
    // -----------------------------------------------------------------------

    public function test_factory_creates_valid_audit_log(): void
    {
        $log = AuditLog::factory()->create();

        $this->assertNotNull($log->id);
        $this->assertNotNull($log->admin_id);
        $this->assertNotNull($log->action);
        $this->assertNotNull($log->created_at);
        $this->assertInstanceOf(Carbon::class, $log->created_at);
    }

    public function test_factory_hard_reset_state(): void
    {
        $log = AuditLog::factory()->hardReset()->create();

        $this->assertEquals('user.hard_reset', $log->action);
        $this->assertArrayHasKey('items_count', $log->old_values);
    }

    public function test_factory_role_changed_state(): void
    {
        $log = AuditLog::factory()->roleChanged()->create();

        $this->assertEquals('user.role_changed', $log->action);
        $this->assertEquals(['is_admin' => false], $log->old_values);
        $this->assertEquals(['is_admin' => true], $log->new_values);
    }

    // -----------------------------------------------------------------------
    // Relationship
    // -----------------------------------------------------------------------

    public function test_admin_relationship_loads_correctly(): void
    {
        $admin = User::factory()->admin()->create();
        $log = AuditLog::factory()->create(['admin_id' => (string) $admin->getKey()]);

        $this->assertEquals((string) $admin->getKey(), (string) $log->admin->getKey());
        $this->assertEquals($admin->name, $log->admin->name);
    }
}

<?php

declare(strict_types=1);

namespace Tests\Feature\Admin;

use App\Models\FeatureFlag;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class AdminFeatureFlagTest extends TestCase
{
    use RefreshDatabase;

    public function test_non_admin_cannot_view_feature_flags(): void
    {
        $user = User::factory()->create(['is_admin' => false]);

        $this->actingAs($user)->get('/admin/feature-flags')->assertForbidden();
    }

    public function test_admin_can_view_feature_flags_index(): void
    {
        $admin = User::factory()->admin()->create();
        FeatureFlag::factory()->count(3)->create();

        $this->actingAs($admin)
            ->get('/admin/feature-flags')
            ->assertOk();
    }

    public function test_admin_can_toggle_existing_flag(): void
    {
        $admin = User::factory()->admin()->create();
        FeatureFlag::factory()->create(['key' => 'existing_flag', 'enabled' => false]);

        $this->actingAs($admin)
            ->patch('/admin/feature-flags/existing_flag', ['enabled' => true])
            ->assertRedirect('/admin/feature-flags');

        $this->assertDatabaseHas('feature_flags', ['key' => 'existing_flag', 'enabled' => true]);
    }

    public function test_admin_toggle_creates_missing_flag_with_humanised_label(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)
            ->patch('/admin/feature-flags/fresh_flag', ['enabled' => true])
            ->assertRedirect();

        $this->assertDatabaseHas('feature_flags', [
            'key' => 'fresh_flag',
            'enabled' => true,
            'label' => 'Fresh Flag',
        ]);
    }

    public function test_toggle_rejects_invalid_flag_key(): void
    {
        $admin = User::factory()->admin()->create();

        // Route regex already blocks most garbage, but test the controller
        // guard too: leading uppercase is outside the pattern and should 404
        // at the route layer.
        $this->actingAs($admin)
            ->patch('/admin/feature-flags/Invalid-Key!', ['enabled' => true])
            ->assertNotFound();
    }

    public function test_toggle_requires_enabled_boolean(): void
    {
        $admin = User::factory()->admin()->create();
        FeatureFlag::factory()->create(['key' => 'needs_bool', 'enabled' => false]);

        $this->actingAs($admin)
            ->patchJson('/admin/feature-flags/needs_bool', ['enabled' => 'yes-please'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('enabled');
    }

    public function test_non_admin_cannot_toggle_flags(): void
    {
        $user = User::factory()->create(['is_admin' => false]);
        FeatureFlag::factory()->create(['key' => 'locked_flag', 'enabled' => false]);

        $this->actingAs($user)
            ->patch('/admin/feature-flags/locked_flag', ['enabled' => true])
            ->assertForbidden();

        $this->assertDatabaseHas('feature_flags', ['key' => 'locked_flag', 'enabled' => false]);
    }

    public function test_toggle_writes_audit_log(): void
    {
        $admin = User::factory()->admin()->create();
        FeatureFlag::factory()->create(['key' => 'audited', 'enabled' => false]);

        $this->actingAs($admin)->patch('/admin/feature-flags/audited', ['enabled' => true]);

        $this->assertDatabaseHas('audit_logs', [
            'user_id' => $admin->id,
            'action' => 'feature_flag_updated',
            'resource_id' => 'audited',
            'status' => 'success',
        ]);
    }
}

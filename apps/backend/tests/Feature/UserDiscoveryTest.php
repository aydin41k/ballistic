<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class UserDiscoveryTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_discover_another_user_by_email(): void
    {
        $searcher = User::factory()->create();
        $targetUser = User::factory()->create([
            'email' => 'john.doe@example.com',
            'name' => 'John Doe',
        ]);

        $response = $this->actingAs($searcher)
            ->postJson('/api/users/discover', [
                'email' => 'john.doe@example.com',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('found', true)
            ->assertJsonFragment([
                'id' => $targetUser->id,
                'name' => 'John Doe',
            ]);
    }

    public function test_user_can_discover_another_user_by_phone(): void
    {
        $searcher = User::factory()->create();
        $targetUser = User::factory()->create([
            'phone' => '+61412345678',
            'name' => 'Jane Smith',
        ]);

        $response = $this->actingAs($searcher)
            ->postJson('/api/users/discover', [
                'phone' => '412345678',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('found', true)
            ->assertJsonFragment([
                'id' => $targetUser->id,
                'name' => 'Jane Smith',
            ]);
    }

    public function test_discovery_returns_not_found_for_nonexistent_email(): void
    {
        $searcher = User::factory()->create();

        $response = $this->actingAs($searcher)
            ->postJson('/api/users/discover', [
                'email' => 'nonexistent@example.com',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('found', false)
            ->assertJsonPath('message', 'No user found with that email or phone number.');
    }

    public function test_discovery_returns_not_found_for_nonexistent_phone(): void
    {
        $searcher = User::factory()->create();

        $response = $this->actingAs($searcher)
            ->postJson('/api/users/discover', [
                'phone' => '999888777',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('found', false);
    }

    public function test_user_cannot_discover_themselves(): void
    {
        $user = User::factory()->create([
            'email' => 'self@example.com',
        ]);

        $response = $this->actingAs($user)
            ->postJson('/api/users/discover', [
                'email' => 'self@example.com',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('found', false);
    }

    public function test_discovery_requires_email_or_phone(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->postJson('/api/users/discover', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email', 'phone']);
    }

    public function test_discovery_requires_authentication(): void
    {
        $response = $this->postJson('/api/users/discover', [
            'email' => 'test@example.com',
        ]);

        $response->assertStatus(401);
    }

    public function test_discovery_returns_masked_email(): void
    {
        $searcher = User::factory()->create();
        User::factory()->create([
            'email' => 'john.doe@example.com',
            'name' => 'John Doe',
        ]);

        $response = $this->actingAs($searcher)
            ->postJson('/api/users/discover', [
                'email' => 'john.doe@example.com',
            ]);

        $response->assertStatus(200)
            ->assertJsonFragment([
                'email_masked' => 'j***@example.com',
            ]);

        // Ensure full email is not exposed
        $response->assertJsonMissing([
            'email' => 'john.doe@example.com',
        ]);
    }

    public function test_discovery_works_with_international_phone_format(): void
    {
        $searcher = User::factory()->create();
        $targetUser = User::factory()->create([
            'phone' => '+61 412 345 678',
            'name' => 'Aussie User',
        ]);

        // Search with different format
        $response = $this->actingAs($searcher)
            ->postJson('/api/users/discover', [
                'phone' => '+61412345678',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('found', true)
            ->assertJsonFragment([
                'id' => $targetUser->id,
            ]);
    }
}

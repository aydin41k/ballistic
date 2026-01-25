<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Cache\RateLimiter;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

final class RateLimitingTest extends TestCase
{
    use RefreshDatabase;

    #[\Override]
    protected function setUp(): void
    {
        parent::setUp();

        // Clear cache to ensure clean rate limiter state
        Cache::flush();
    }

    public function test_register_endpoint_is_rate_limited(): void
    {
        // The auth rate limiter allows 5 requests per minute per IP
        // Make 5 successful requests first
        for ($i = 1; $i <= 5; $i++) {
            $response = $this->postJson('/api/register', [
                'name' => "Test User $i",
                'email' => "test$i@example.com",
                'password' => 'password123',
                'password_confirmation' => 'password123',
            ]);

            $response->assertStatus(201);
        }

        // 6th request should be rate limited
        $response = $this->postJson('/api/register', [
            'name' => 'Test User 6',
            'email' => 'test6@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(429);
    }

    public function test_login_endpoint_is_rate_limited_by_route(): void
    {
        // Create test user
        User::factory()->create([
            'email' => 'existing@example.com',
            'password' => bcrypt('password123'),
        ]);

        // The route-level auth rate limiter allows 5 requests per minute per IP
        // Note: The controller also has its own rate limiting which may trigger first
        // Test that either the route or controller rate limiting kicks in

        for ($i = 1; $i <= 5; $i++) {
            $response = $this->postJson('/api/login', [
                'email' => 'nonexistent@example.com',
                'password' => 'wrongpassword',
            ]);

            // First 5 should get 422 (validation error), not 429
            $response->assertStatus(422);
        }

        // 6th request should be rate limited (either by route or controller)
        $response = $this->postJson('/api/login', [
            'email' => 'nonexistent@example.com',
            'password' => 'wrongpassword',
        ]);

        // Could be 429 from route or 422 with throttle message from controller
        $this->assertTrue(
            $response->status() === 429 || (
                $response->status() === 422 &&
                str_contains($response->json('message', ''), 'Too many')
            ),
            "Expected rate limiting response, got: ".$response->status()." - ".$response->getContent()
        );
    }

    public function test_user_discovery_endpoint_is_rate_limited(): void
    {
        $user = User::factory()->create();

        // The user-search rate limiter allows 30 requests per minute
        for ($i = 1; $i <= 30; $i++) {
            $response = $this->actingAs($user)
                ->postJson('/api/users/discover', [
                    'email' => "nonexistent$i@example.com",
                ]);

            $response->assertStatus(200);
        }

        // 31st request should be rate limited
        $response = $this->actingAs($user)
            ->postJson('/api/users/discover', [
                'email' => 'nonexistent31@example.com',
            ]);

        $response->assertStatus(429);
    }

    public function test_user_lookup_endpoint_is_rate_limited(): void
    {
        $user = User::factory()->create();

        // The user-search rate limiter allows 30 requests per minute
        for ($i = 1; $i <= 30; $i++) {
            $response = $this->actingAs($user)
                ->getJson('/api/users/lookup?q=test'.$i.'@example.com');

            $response->assertStatus(200);
        }

        // 31st request should be rate limited
        $response = $this->actingAs($user)
            ->getJson('/api/users/lookup?q=test31@example.com');

        $response->assertStatus(429);
    }

    public function test_connection_store_endpoint_is_rate_limited(): void
    {
        $user = User::factory()->create();
        $targets = User::factory()->count(11)->create();

        // The connections rate limiter allows 10 requests per minute
        for ($i = 0; $i < 10; $i++) {
            $response = $this->actingAs($user)
                ->postJson('/api/connections', [
                    'user_id' => $targets[$i]->id,
                ]);

            $response->assertStatus(201);
        }

        // 11th request should be rate limited
        $response = $this->actingAs($user)
            ->postJson('/api/connections', [
                'user_id' => $targets[10]->id,
            ]);

        $response->assertStatus(429);
    }

    public function test_rate_limit_returns_retry_after_header(): void
    {
        // Exhaust the auth rate limit with register endpoint
        for ($i = 1; $i <= 5; $i++) {
            $this->postJson('/api/register', [
                'name' => "Test User $i",
                'email' => "headertest$i@example.com",
                'password' => 'password123',
                'password_confirmation' => 'password123',
            ]);
        }

        $response = $this->postJson('/api/register', [
            'name' => 'Test User 6',
            'email' => 'headertest6@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(429);
        $response->assertHeader('Retry-After');
    }

    public function test_authenticated_endpoints_have_general_rate_limit(): void
    {
        $user = User::factory()->create();

        // The general API rate limiter allows 60 requests per minute
        for ($i = 1; $i <= 60; $i++) {
            $response = $this->actingAs($user)
                ->getJson('/api/user');

            $response->assertStatus(200);
        }

        // 61st request should be rate limited
        $response = $this->actingAs($user)
            ->getJson('/api/user');

        $response->assertStatus(429);
    }

    public function test_rate_limiting_uses_different_limits_for_different_users(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();

        // Exhaust rate limit for user1 on discovery endpoint
        for ($i = 1; $i <= 30; $i++) {
            $this->actingAs($user1)
                ->postJson('/api/users/discover', [
                    'email' => "test$i@example.com",
                ]);
        }

        // User1 should be rate limited
        $response = $this->actingAs($user1)
            ->postJson('/api/users/discover', [
                'email' => 'test31@example.com',
            ]);
        $response->assertStatus(429);

        // User2 should still be able to make requests
        $response = $this->actingAs($user2)
            ->postJson('/api/users/discover', [
                'email' => 'test32@example.com',
            ]);
        $response->assertStatus(200);
    }
}

<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\PushSubscription;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class PushSubscriptionTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_get_vapid_public_key(): void
    {
        config(['services.webpush.public_key' => 'test-public-key']);

        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->getJson('/api/push/vapid-key');

        $response->assertOk()
            ->assertJsonStructure(['public_key'])
            ->assertJson(['public_key' => 'test-public-key']);
    }

    public function test_vapid_key_returns_503_when_not_configured(): void
    {
        config(['services.webpush.public_key' => null]);

        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->getJson('/api/push/vapid-key');

        $response->assertStatus(503);
    }

    public function test_user_can_subscribe_to_push_notifications(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->postJson('/api/push/subscribe', [
                'endpoint' => 'https://fcm.googleapis.com/fcm/send/test-endpoint',
                'keys' => [
                    'p256dh' => 'test-p256dh-key',
                    'auth' => 'test-auth-key',
                ],
            ]);

        $response->assertCreated()
            ->assertJsonStructure(['message', 'subscription_id']);

        $this->assertDatabaseHas('push_subscriptions', [
            'user_id' => $user->id,
            'endpoint' => 'https://fcm.googleapis.com/fcm/send/test-endpoint',
            'p256dh_key' => 'test-p256dh-key',
            'auth_key' => 'test-auth-key',
        ]);
    }

    public function test_subscribe_updates_existing_subscription(): void
    {
        $user = User::factory()->create();
        $endpoint = 'https://fcm.googleapis.com/fcm/send/test-endpoint';

        $subscription = PushSubscription::create([
            'user_id' => $user->id,
            'endpoint' => $endpoint,
            'p256dh_key' => 'old-p256dh-key',
            'auth_key' => 'old-auth-key',
        ]);

        $response = $this->actingAs($user)
            ->postJson('/api/push/subscribe', [
                'endpoint' => $endpoint,
                'keys' => [
                    'p256dh' => 'new-p256dh-key',
                    'auth' => 'new-auth-key',
                ],
            ]);

        $response->assertOk()
            ->assertJson(['message' => 'Subscription updated']);

        $this->assertDatabaseHas('push_subscriptions', [
            'id' => $subscription->id,
            'p256dh_key' => 'new-p256dh-key',
            'auth_key' => 'new-auth-key',
        ]);

        // Should not create a new subscription
        $this->assertEquals(1, PushSubscription::where('endpoint', $endpoint)->count());
    }

    public function test_user_can_unsubscribe_from_push_notifications(): void
    {
        $user = User::factory()->create();
        $endpoint = 'https://fcm.googleapis.com/fcm/send/test-endpoint';

        PushSubscription::create([
            'user_id' => $user->id,
            'endpoint' => $endpoint,
            'p256dh_key' => 'test-p256dh-key',
            'auth_key' => 'test-auth-key',
        ]);

        $response = $this->actingAs($user)
            ->postJson('/api/push/unsubscribe', [
                'endpoint' => $endpoint,
            ]);

        $response->assertOk()
            ->assertJson(['message' => 'Subscription removed']);

        $this->assertDatabaseMissing('push_subscriptions', [
            'user_id' => $user->id,
            'endpoint' => $endpoint,
        ]);
    }

    public function test_unsubscribe_returns_404_for_nonexistent_subscription(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->postJson('/api/push/unsubscribe', [
                'endpoint' => 'https://fcm.googleapis.com/fcm/send/nonexistent',
            ]);

        $response->assertNotFound();
    }

    public function test_user_can_list_their_subscriptions(): void
    {
        $user = User::factory()->create();

        PushSubscription::create([
            'user_id' => $user->id,
            'endpoint' => 'https://fcm.googleapis.com/fcm/send/endpoint-1',
            'p256dh_key' => 'key-1',
            'auth_key' => 'auth-1',
            'user_agent' => 'Mozilla/5.0 Chrome',
        ]);

        PushSubscription::create([
            'user_id' => $user->id,
            'endpoint' => 'https://updates.push.services.mozilla.com/endpoint-2',
            'p256dh_key' => 'key-2',
            'auth_key' => 'auth-2',
            'user_agent' => 'Mozilla/5.0 Firefox',
        ]);

        $response = $this->actingAs($user)
            ->getJson('/api/push/subscriptions');

        $response->assertOk()
            ->assertJsonStructure([
                'subscriptions' => [
                    '*' => ['id', 'endpoint_domain', 'user_agent', 'last_used_at', 'created_at'],
                ],
                'count',
            ])
            ->assertJson(['count' => 2]);
    }

    public function test_user_cannot_see_other_users_subscriptions(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();

        PushSubscription::create([
            'user_id' => $user1->id,
            'endpoint' => 'https://fcm.googleapis.com/fcm/send/user1-endpoint',
            'p256dh_key' => 'key-1',
            'auth_key' => 'auth-1',
        ]);

        $response = $this->actingAs($user2)
            ->getJson('/api/push/subscriptions');

        $response->assertOk()
            ->assertJson(['count' => 0]);
    }

    public function test_user_can_delete_subscription_by_id(): void
    {
        $user = User::factory()->create();

        $subscription = PushSubscription::create([
            'user_id' => $user->id,
            'endpoint' => 'https://fcm.googleapis.com/fcm/send/test-endpoint',
            'p256dh_key' => 'key',
            'auth_key' => 'auth',
        ]);

        $response = $this->actingAs($user)
            ->deleteJson("/api/push/subscriptions/{$subscription->id}");

        $response->assertOk()
            ->assertJson(['message' => 'Subscription removed']);

        $this->assertDatabaseMissing('push_subscriptions', [
            'id' => $subscription->id,
        ]);
    }

    public function test_user_cannot_delete_other_users_subscription(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();

        $subscription = PushSubscription::create([
            'user_id' => $user1->id,
            'endpoint' => 'https://fcm.googleapis.com/fcm/send/test-endpoint',
            'p256dh_key' => 'key',
            'auth_key' => 'auth',
        ]);

        $response = $this->actingAs($user2)
            ->deleteJson("/api/push/subscriptions/{$subscription->id}");

        $response->assertForbidden();

        $this->assertDatabaseHas('push_subscriptions', [
            'id' => $subscription->id,
        ]);
    }

    public function test_subscribe_validates_required_fields(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->postJson('/api/push/subscribe', []);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['endpoint', 'keys.p256dh', 'keys.auth']);
    }

    public function test_subscribe_validates_endpoint_is_url(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->postJson('/api/push/subscribe', [
                'endpoint' => 'not-a-url',
                'keys' => [
                    'p256dh' => 'key',
                    'auth' => 'auth',
                ],
            ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['endpoint']);
    }

    public function test_push_endpoints_require_authentication(): void
    {
        $this->getJson('/api/push/vapid-key')->assertUnauthorized();
        $this->getJson('/api/push/subscriptions')->assertUnauthorized();
        $this->postJson('/api/push/subscribe', [])->assertUnauthorized();
        $this->postJson('/api/push/unsubscribe', [])->assertUnauthorized();
    }

    public function test_subscription_tracks_user_agent(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->withHeader('User-Agent', 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)')
            ->postJson('/api/push/subscribe', [
                'endpoint' => 'https://fcm.googleapis.com/fcm/send/test-endpoint',
                'keys' => [
                    'p256dh' => 'test-p256dh-key',
                    'auth' => 'test-auth-key',
                ],
            ]);

        $response->assertCreated();

        $this->assertDatabaseHas('push_subscriptions', [
            'user_id' => $user->id,
            'user_agent' => 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',
        ]);
    }
}

<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\MobilePushSubscription;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class MobilePushSubscriptionTest extends TestCase
{
    use RefreshDatabase;

    private const TOKEN = 'ExpoPushToken[test-token-123]';

    public function test_user_can_subscribe_a_mobile_device(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/mobile/push/subscribe', [
            'expo_push_token' => self::TOKEN,
            'platform' => 'ios',
            'device_name' => 'Vic’s iPhone',
        ]);

        $response->assertCreated()
            ->assertJsonStructure(['message', 'subscription_id']);

        $this->assertDatabaseHas('mobile_push_subscriptions', [
            'user_id' => $user->id,
            'expo_push_token' => self::TOKEN,
            'platform' => 'ios',
            'device_name' => 'Vic’s iPhone',
        ]);
    }

    public function test_subscribe_updates_an_existing_mobile_device(): void
    {
        $user = User::factory()->create();
        $subscription = MobilePushSubscription::create([
            'user_id' => $user->id,
            'expo_push_token' => self::TOKEN,
            'platform' => 'ios',
            'device_name' => 'Old name',
        ]);

        $response = $this->actingAs($user)->postJson('/api/mobile/push/subscribe', [
            'expo_push_token' => self::TOKEN,
            'platform' => 'android',
            'device_name' => 'Pixel',
        ]);

        $response->assertOk()
            ->assertJson([
                'message' => 'Mobile push subscription updated',
                'subscription_id' => $subscription->id,
            ]);

        $this->assertDatabaseHas('mobile_push_subscriptions', [
            'id' => $subscription->id,
            'platform' => 'android',
            'device_name' => 'Pixel',
        ]);
        $this->assertSame(1, MobilePushSubscription::where('expo_push_token', self::TOKEN)->count());
    }

    public function test_user_can_list_only_their_mobile_devices(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        MobilePushSubscription::create([
            'user_id' => $user->id,
            'expo_push_token' => self::TOKEN,
            'platform' => 'ios',
            'device_name' => 'iPhone',
        ]);
        MobilePushSubscription::create([
            'user_id' => $otherUser->id,
            'expo_push_token' => 'ExpoPushToken[other-token-456]',
            'platform' => 'android',
            'device_name' => 'Pixel',
        ]);

        $response = $this->actingAs($user)->getJson('/api/mobile/push/subscriptions');

        $response->assertOk()
            ->assertJson(['count' => 1])
            ->assertJsonStructure([
                'subscriptions' => [
                    '*' => ['id', 'platform', 'device_name', 'last_used_at', 'created_at'],
                ],
            ])
            ->assertJsonPath('subscriptions.0.device_name', 'iPhone');
    }

    public function test_user_can_unsubscribe_the_current_mobile_device(): void
    {
        $user = User::factory()->create();
        MobilePushSubscription::create([
            'user_id' => $user->id,
            'expo_push_token' => self::TOKEN,
            'platform' => 'ios',
        ]);

        $this->actingAs($user)
            ->postJson('/api/mobile/push/unsubscribe', ['expo_push_token' => self::TOKEN])
            ->assertOk()
            ->assertJson(['message' => 'Mobile push subscription removed']);

        $this->assertDatabaseMissing('mobile_push_subscriptions', [
            'expo_push_token' => self::TOKEN,
        ]);
    }

    public function test_unsubscribe_returns_not_found_for_an_unknown_device(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->postJson('/api/mobile/push/unsubscribe', ['expo_push_token' => self::TOKEN])
            ->assertNotFound();
    }

    public function test_user_can_delete_their_mobile_subscription_by_id(): void
    {
        $user = User::factory()->create();
        $subscription = MobilePushSubscription::create([
            'user_id' => $user->id,
            'expo_push_token' => self::TOKEN,
            'platform' => 'ios',
        ]);

        $this->actingAs($user)
            ->deleteJson("/api/mobile/push/subscriptions/{$subscription->id}")
            ->assertOk();

        $this->assertDatabaseMissing('mobile_push_subscriptions', ['id' => $subscription->id]);
    }

    public function test_user_cannot_delete_another_users_mobile_subscription(): void
    {
        $owner = User::factory()->create();
        $otherUser = User::factory()->create();
        $subscription = MobilePushSubscription::create([
            'user_id' => $owner->id,
            'expo_push_token' => self::TOKEN,
            'platform' => 'ios',
        ]);

        $this->actingAs($otherUser)
            ->deleteJson("/api/mobile/push/subscriptions/{$subscription->id}")
            ->assertForbidden();

        $this->assertDatabaseHas('mobile_push_subscriptions', ['id' => $subscription->id]);
    }

    public function test_subscribe_validates_token_and_platform(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->postJson('/api/mobile/push/subscribe', [
                'expo_push_token' => 'not-an-expo-token',
                'platform' => 'windows',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['expo_push_token', 'platform']);
    }

    public function test_mobile_push_endpoints_require_authentication(): void
    {
        $this->getJson('/api/mobile/push/subscriptions')->assertUnauthorized();
        $this->postJson('/api/mobile/push/subscribe', [])->assertUnauthorized();
        $this->postJson('/api/mobile/push/unsubscribe', [])->assertUnauthorized();
    }
}

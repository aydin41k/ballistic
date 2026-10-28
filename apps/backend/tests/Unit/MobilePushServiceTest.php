<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Contracts\Services\MobilePushServiceInterface;
use App\Models\MobilePushSubscription;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

final class MobilePushServiceTest extends TestCase
{
    use RefreshDatabase;

    private const ENDPOINT = 'https://exp.host/--/api/v2/push/send';

    protected function setUp(): void
    {
        parent::setUp();

        config(['services.expo_push.endpoint' => self::ENDPOINT]);
    }

    public function test_service_delivers_and_marks_a_subscription_as_used(): void
    {
        Http::fake([
            self::ENDPOINT => Http::response([
                'data' => [['status' => 'ok', 'id' => 'receipt-1']],
            ]),
        ]);
        $user = User::factory()->create();
        $subscription = $this->createSubscription($user);

        $delivered = $this->service()->sendToUser($user, [
            'title' => 'Task assigned',
            'body' => 'A task is waiting for you.',
            'data' => ['item_id' => 'item-123'],
        ]);

        $this->assertSame(1, $delivered);
        $this->assertNotNull($subscription->refresh()->last_used_at);
        Http::assertSent(function (Request $request): bool {
            $messages = $request->data();

            return $request->url() === self::ENDPOINT
                && $messages[0]['to'] === 'ExpoPushToken[test-token-123]'
                && $messages[0]['title'] === 'Task assigned'
                && $messages[0]['data']['item_id'] === 'item-123'
                && $messages[0]['channelId'] === 'ballistic';
        });
    }

    public function test_service_removes_a_device_that_is_no_longer_registered(): void
    {
        Http::fake([
            self::ENDPOINT => Http::response([
                'data' => [[
                    'status' => 'error',
                    'message' => 'Device is not registered',
                    'details' => ['error' => 'DeviceNotRegistered'],
                ]],
            ]),
        ]);
        $user = User::factory()->create();
        $subscription = $this->createSubscription($user);

        $delivered = $this->service()->sendToUser($user, [
            'title' => 'Update',
            'body' => 'Something changed.',
        ]);

        $this->assertSame(0, $delivered);
        $this->assertDatabaseMissing('mobile_push_subscriptions', ['id' => $subscription->id]);
    }

    public function test_service_keeps_subscriptions_when_expo_is_unavailable(): void
    {
        Http::fake([self::ENDPOINT => Http::response([], 503)]);
        $user = User::factory()->create();
        $subscription = $this->createSubscription($user);

        $delivered = $this->service()->sendToUser($user, [
            'title' => 'Update',
            'body' => 'Something changed.',
        ]);

        $this->assertSame(0, $delivered);
        $this->assertDatabaseHas('mobile_push_subscriptions', ['id' => $subscription->id]);
    }

    public function test_service_does_not_make_a_request_without_subscriptions(): void
    {
        Http::fake();
        $user = User::factory()->create();

        $delivered = $this->service()->sendToUser($user, [
            'title' => 'Update',
            'body' => 'Something changed.',
        ]);

        $this->assertSame(0, $delivered);
        Http::assertNothingSent();
    }

    private function service(): MobilePushServiceInterface
    {
        return app(MobilePushServiceInterface::class);
    }

    private function createSubscription(User $user): MobilePushSubscription
    {
        return MobilePushSubscription::create([
            'user_id' => $user->id,
            'expo_push_token' => 'ExpoPushToken[test-token-123]',
            'platform' => 'ios',
            'device_name' => 'Test iPhone',
        ]);
    }
}

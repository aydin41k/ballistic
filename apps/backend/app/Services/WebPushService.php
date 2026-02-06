<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\PushSubscription;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Minishlink\WebPush\Subscription;
use Minishlink\WebPush\WebPush;

/**
 * Service for sending Web Push notifications using VAPID keys.
 */
final class WebPushService implements WebPushServiceInterface
{
    private ?WebPush $webPush = null;

    /**
     * Get or create the WebPush instance.
     */
    private function getWebPush(): WebPush
    {
        if ($this->webPush === null) {
            $auth = [
                'VAPID' => [
                    'subject' => config('services.webpush.subject'),
                    'publicKey' => config('services.webpush.public_key'),
                    'privateKey' => config('services.webpush.private_key'),
                ],
            ];

            $this->webPush = new WebPush($auth);
            $this->webPush->setReuseVAPIDHeaders(true);
        }

        return $this->webPush;
    }

    /**
     * Check if Web Push is configured.
     */
    public function isConfigured(): bool
    {
        return ! empty(config('services.webpush.public_key'))
            && ! empty(config('services.webpush.private_key'))
            && ! empty(config('services.webpush.subject'));
    }

    /**
     * Get the public VAPID key for client-side subscription.
     */
    public function getPublicKey(): ?string
    {
        return config('services.webpush.public_key');
    }

    /**
     * Send a push notification to a specific subscription.
     *
     * @param  array{title: string, body: string, icon?: string, badge?: string, data?: array<string, mixed>}  $payload
     */
    public function sendToSubscription(PushSubscription $subscription, array $payload): bool
    {
        if (! $this->isConfigured()) {
            Log::warning('WebPush: VAPID keys not configured, skipping push notification');

            return false;
        }

        try {
            $webPushSubscription = Subscription::create($subscription->toWebPushFormat());
            $this->getWebPush()->queueNotification(
                $webPushSubscription,
                json_encode($payload, JSON_THROW_ON_ERROR)
            );

            $results = $this->getWebPush()->flush();

            foreach ($results as $report) {
                if ($report->isSuccess()) {
                    $subscription->markAsUsed();

                    return true;
                }

                $reason = $report->getReason();

                // Subscription expired or invalid - remove it
                if ($report->isSubscriptionExpired()) {
                    Log::info('WebPush: Removing expired subscription', [
                        'subscription_id' => $subscription->id,
                        'endpoint' => $subscription->endpoint,
                    ]);
                    $subscription->delete();

                    return false;
                }

                Log::warning('WebPush: Failed to send notification', [
                    'subscription_id' => $subscription->id,
                    'reason' => $reason,
                ]);
            }

            return false;
        } catch (\Throwable $e) {
            Log::error('WebPush: Exception while sending notification', [
                'subscription_id' => $subscription->id,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    /**
     * Send a push notification to all subscriptions for a user.
     *
     * @param  array{title: string, body: string, icon?: string, badge?: string, data?: array<string, mixed>}  $payload
     * @return int Number of successful deliveries
     */
    public function sendToUser(User $user, array $payload): int
    {
        if (! $this->isConfigured()) {
            return 0;
        }

        $subscriptions = $user->pushSubscriptions()->get();

        if ($subscriptions->isEmpty()) {
            return 0;
        }

        return $this->sendToSubscriptions($subscriptions, $payload);
    }

    /**
     * Send a push notification to multiple subscriptions.
     *
     * @param  Collection<int, PushSubscription>  $subscriptions
     * @param  array{title: string, body: string, icon?: string, badge?: string, data?: array<string, mixed>}  $payload
     * @return int Number of successful deliveries
     */
    public function sendToSubscriptions(Collection $subscriptions, array $payload): int
    {
        if (! $this->isConfigured() || $subscriptions->isEmpty()) {
            return 0;
        }

        $webPush = $this->getWebPush();
        $payloadJson = json_encode($payload, JSON_THROW_ON_ERROR);

        // Queue all notifications
        $indexedSubscriptions = $subscriptions->values();
        foreach ($indexedSubscriptions as $subscription) {
            try {
                $webPushSubscription = Subscription::create($subscription->toWebPushFormat());
                $webPush->queueNotification($webPushSubscription, $payloadJson);
            } catch (\Throwable $e) {
                Log::warning('WebPush: Failed to queue notification', [
                    'subscription_id' => $subscription->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        // Flush and process results - collect IDs for batch operations
        $successfulIds = [];
        $expiredIds = [];
        $subscriptionIndex = 0;

        foreach ($webPush->flush() as $report) {
            /** @var PushSubscription|null $subscription */
            $subscription = $indexedSubscriptions->get($subscriptionIndex);
            $subscriptionIndex++;

            if ($subscription === null) {
                continue;
            }

            if ($report->isSuccess()) {
                $successfulIds[] = $subscription->id;

                continue;
            }

            if ($report->isSubscriptionExpired()) {
                Log::info('WebPush: Removing expired subscription', [
                    'subscription_id' => $subscription->id,
                ]);
                $expiredIds[] = $subscription->id;

                continue;
            }

            Log::warning('WebPush: Delivery failed', [
                'subscription_id' => $subscription->id,
                'reason' => $report->getReason(),
            ]);
        }

        // Batch database operations atomically to avoid N+1 queries
        DB::transaction(function () use ($successfulIds, $expiredIds): void {
            if (! empty($successfulIds)) {
                PushSubscription::whereIn('id', $successfulIds)
                    ->update(['last_used_at' => now()]);
            }

            if (! empty($expiredIds)) {
                PushSubscription::whereIn('id', $expiredIds)->delete();
            }
        });

        return count($successfulIds);
    }
}

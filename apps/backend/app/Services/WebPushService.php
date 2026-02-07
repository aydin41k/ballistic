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
            Log::channel('webpush')->warning('VAPID keys not configured — push skipped', [
                'subscription_id' => $subscription->id,
            ]);

            return false;
        }

        Log::channel('webpush')->debug('Sending to single subscription', [
            'subscription_id' => $subscription->id,
            'title' => $payload['title'] ?? '(no title)',
        ]);

        try {
            $webPushSubscription = Subscription::create($subscription->toWebPushFormat());
            $this->getWebPush()->queueNotification(
                $webPushSubscription,
                json_encode($payload, JSON_THROW_ON_ERROR)
            );

            $results = $this->getWebPush()->flush();

            foreach ($results as $report) {
                if ($report->isSuccess()) {
                    Log::channel('webpush')->info('Successfully delivered', [
                        'subscription_id' => $subscription->id,
                    ]);
                    $subscription->markAsUsed();

                    return true;
                }

                // Subscription expired or invalid — remove it
                if ($report->isSubscriptionExpired()) {
                    Log::channel('webpush')->info('Subscription expired, removing', [
                        'subscription_id' => $subscription->id,
                        'endpoint' => $subscription->endpoint,
                    ]);
                    $subscription->delete();

                    return false;
                }

                Log::channel('webpush')->warning('Delivery failed', [
                    'subscription_id' => $subscription->id,
                    'reason' => $report->getReason(),
                ]);
            }

            return false;
        } catch (\Throwable $e) {
            Log::channel('webpush')->error('Exception while sending', [
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
            Log::channel('webpush')->warning('VAPID keys not configured — push skipped', [
                'user_id' => $user->id,
            ]);

            return 0;
        }

        $subscriptions = $user->pushSubscriptions()->get();

        if ($subscriptions->isEmpty()) {
            Log::channel('webpush')->debug('No push subscriptions for user', [
                'user_id' => $user->id,
            ]);

            return 0;
        }

        Log::channel('webpush')->info('Dispatching push to user', [
            'user_id' => $user->id,
            'subscription_count' => $subscriptions->count(),
            'title' => $payload['title'] ?? '(no title)',
        ]);

        $delivered = $this->sendToSubscriptions($subscriptions, $payload);

        Log::channel('webpush')->info('Push delivery complete for user', [
            'user_id' => $user->id,
            'delivered' => $delivered,
            'of' => $subscriptions->count(),
        ]);

        return $delivered;
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
        if (! $this->isConfigured()) {
            Log::channel('webpush')->warning('VAPID keys not configured — batch push skipped');

            return 0;
        }

        if ($subscriptions->isEmpty()) {
            return 0;
        }

        $webPush = $this->getWebPush();
        $payloadJson = json_encode($payload, JSON_THROW_ON_ERROR);

        // Only append to $queuedSubscriptions when queueNotification() succeeds.
        // This keeps the array positionally aligned with what flush() will yield —
        // if an entry fails to queue (exception) it is simply absent from both arrays,
        // so there is no off-by-one when matching reports back to subscriptions.
        $queuedSubscriptions = [];

        foreach ($subscriptions as $subscription) {
            try {
                $webPushSubscription = Subscription::create($subscription->toWebPushFormat());
                $webPush->queueNotification($webPushSubscription, $payloadJson);
                $queuedSubscriptions[] = $subscription;
            } catch (\Throwable $e) {
                Log::channel('webpush')->warning('Failed to queue subscription — skipping', [
                    'subscription_id' => $subscription->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        if (empty($queuedSubscriptions)) {
            Log::channel('webpush')->warning('No subscriptions could be queued for batch push');

            return 0;
        }

        Log::channel('webpush')->debug('Flushing queued notifications', [
            'queued' => count($queuedSubscriptions),
        ]);

        // Flush and match each report back to its subscription by position.
        // $queuedSubscriptions[N] corresponds exactly to the Nth report from flush()
        // because both reflect only the notifications that were successfully handed
        // to the library.
        $successfulIds = [];
        $expiredIds = [];
        $reportIndex = 0;

        foreach ($webPush->flush() as $report) {
            $subscription = $queuedSubscriptions[$reportIndex] ?? null;
            $reportIndex++;

            if ($subscription === null) {
                // flush() yielded more reports than we queued — should never happen.
                Log::channel('webpush')->error('Received more flush reports than queued subscriptions', [
                    'report_index' => $reportIndex - 1,
                    'queued_count' => count($queuedSubscriptions),
                ]);

                continue;
            }

            if ($report->isSuccess()) {
                $successfulIds[] = $subscription->id;

                continue;
            }

            if ($report->isSubscriptionExpired()) {
                Log::channel('webpush')->info('Subscription expired, queued for removal', [
                    'subscription_id' => $subscription->id,
                ]);
                $expiredIds[] = $subscription->id;

                continue;
            }

            Log::channel('webpush')->warning('Delivery failed', [
                'subscription_id' => $subscription->id,
                'reason' => $report->getReason(),
            ]);
        }

        // Sanity-check: flush() should yield exactly one report per queued notification.
        if ($reportIndex < count($queuedSubscriptions)) {
            Log::channel('webpush')->warning('Fewer flush reports than queued subscriptions — some deliveries unaccounted for', [
                'expected' => count($queuedSubscriptions),
                'received' => $reportIndex,
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

        Log::channel('webpush')->info('Batch delivery complete', [
            'queued' => count($queuedSubscriptions),
            'delivered' => count($successfulIds),
            'expired_removed' => count($expiredIds),
            'failed' => count($queuedSubscriptions) - count($successfulIds) - count($expiredIds),
        ]);

        return count($successfulIds);
    }
}

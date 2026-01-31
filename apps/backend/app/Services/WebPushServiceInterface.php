<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\PushSubscription;
use App\Models\User;
use Illuminate\Support\Collection;

/**
 * Interface for Web Push notification service.
 */
interface WebPushServiceInterface
{
    /**
     * Check if Web Push is configured.
     */
    public function isConfigured(): bool;

    /**
     * Get the public VAPID key for client-side subscription.
     */
    public function getPublicKey(): ?string;

    /**
     * Send a push notification to a specific subscription.
     *
     * @param  array{title: string, body: string, icon?: string, badge?: string, data?: array<string, mixed>}  $payload
     */
    public function sendToSubscription(PushSubscription $subscription, array $payload): bool;

    /**
     * Send a push notification to all subscriptions for a user.
     *
     * @param  array{title: string, body: string, icon?: string, badge?: string, data?: array<string, mixed>}  $payload
     * @return int Number of successful deliveries
     */
    public function sendToUser(User $user, array $payload): int;

    /**
     * Send a push notification to multiple subscriptions.
     *
     * @param  Collection<int, PushSubscription>  $subscriptions
     * @param  array{title: string, body: string, icon?: string, badge?: string, data?: array<string, mixed>}  $payload
     * @return int Number of successful deliveries
     */
    public function sendToSubscriptions(Collection $subscriptions, array $payload): int;
}

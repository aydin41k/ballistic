<?php

declare(strict_types=1);

namespace App\Contracts\Services;

use App\Models\MobilePushSubscription;
use App\Models\User;
use Illuminate\Support\Collection;

interface MobilePushServiceInterface
{
    /**
     * @param  array{title: string, body: string, data?: array<string, mixed>}  $payload
     * @return int Number of successful deliveries
     */
    public function sendToUser(User $user, array $payload): int;

    /**
     * @param  Collection<int, MobilePushSubscription>  $subscriptions
     * @param  array{title: string, body: string, data?: array<string, mixed>}  $payload
     * @return int Number of successful deliveries
     */
    public function sendToSubscriptions(Collection $subscriptions, array $payload): int;
}

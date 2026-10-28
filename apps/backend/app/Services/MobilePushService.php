<?php

declare(strict_types=1);

namespace App\Services;

use App\Contracts\Services\MobilePushServiceInterface;
use App\Models\MobilePushSubscription;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Delivers native notifications through the Expo Push API.
 */
final class MobilePushService implements MobilePushServiceInterface
{
    /**
     * @param  array{title: string, body: string, data?: array<string, mixed>}  $payload
     */
    public function sendToUser(User $user, array $payload): int
    {
        return $this->sendToSubscriptions($user->mobilePushSubscriptions()->get(), $payload);
    }

    /**
     * @param  Collection<int, MobilePushSubscription>  $subscriptions
     * @param  array{title: string, body: string, data?: array<string, mixed>}  $payload
     */
    public function sendToSubscriptions(Collection $subscriptions, array $payload): int
    {
        if ($subscriptions->isEmpty()) {
            return 0;
        }

        $endpoint = (string) config('services.expo_push.endpoint');
        if ($endpoint === '') {
            Log::warning('Expo Push endpoint is not configured');

            return 0;
        }

        $successfulIds = [];
        $expiredIds = [];

        foreach ($subscriptions->chunk(100) as $chunk) {
            $messages = $chunk->values()->map(
                fn (MobilePushSubscription $subscription): array => [
                    'to' => $subscription->expo_push_token,
                    'title' => $payload['title'],
                    'body' => $payload['body'],
                    'sound' => 'default',
                    'priority' => 'high',
                    'channelId' => 'ballistic',
                    'data' => $payload['data'] ?? [],
                ]
            )->all();

            try {
                $response = Http::acceptJson()
                    ->asJson()
                    ->timeout(10)
                    ->post($endpoint, $messages);
            } catch (\Throwable $exception) {
                Log::warning('Expo Push request failed', [
                    'error' => $exception->getMessage(),
                    'subscription_count' => $chunk->count(),
                ]);

                continue;
            }

            if ($response->failed()) {
                Log::warning('Expo Push returned an unsuccessful response', [
                    'status' => $response->status(),
                    'subscription_count' => $chunk->count(),
                ]);

                continue;
            }

            $results = $response->json('data');
            if (! is_array($results)) {
                Log::warning('Expo Push returned an invalid response payload');

                continue;
            }

            foreach ($chunk->values() as $index => $subscription) {
                $result = $results[$index] ?? null;
                if (! is_array($result)) {
                    continue;
                }

                if (($result['status'] ?? null) === 'ok') {
                    $successfulIds[] = $subscription->id;

                    continue;
                }

                $error = $result['details']['error'] ?? null;
                if ($error === 'DeviceNotRegistered') {
                    $expiredIds[] = $subscription->id;

                    continue;
                }

                Log::warning('Expo Push delivery failed', [
                    'subscription_id' => $subscription->id,
                    'error' => $error ?? $result['message'] ?? 'Unknown error',
                ]);
            }
        }

        DB::transaction(function () use ($successfulIds, $expiredIds): void {
            if ($successfulIds !== []) {
                MobilePushSubscription::whereIn('id', $successfulIds)
                    ->update(['last_used_at' => now()]);
            }

            if ($expiredIds !== []) {
                MobilePushSubscription::whereIn('id', $expiredIds)->delete();
            }
        });

        return count($successfulIds);
    }
}

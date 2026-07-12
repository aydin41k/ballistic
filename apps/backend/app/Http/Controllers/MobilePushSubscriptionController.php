<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\SubscribeMobilePushRequest;
use App\Http\Requests\UnsubscribeMobilePushRequest;
use App\Models\MobilePushSubscription;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

/**
 * Manage native iOS and Android push subscriptions.
 */
final class MobilePushSubscriptionController extends Controller
{
    public function index(): JsonResponse
    {
        $user = Auth::user();

        $subscriptions = $user->mobilePushSubscriptions()
            ->select(['id', 'platform', 'device_name', 'last_used_at', 'created_at'])
            ->orderByDesc('last_used_at')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (MobilePushSubscription $subscription): array => [
                'id' => $subscription->id,
                'platform' => $subscription->platform,
                'device_name' => $subscription->device_name,
                'last_used_at' => $subscription->last_used_at?->toIso8601String(),
                'created_at' => $subscription->created_at->toIso8601String(),
            ]);

        return response()->json([
            'subscriptions' => $subscriptions,
            'count' => $subscriptions->count(),
        ]);
    }

    public function subscribe(SubscribeMobilePushRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $user = Auth::user();

        $subscription = MobilePushSubscription::where(
            'expo_push_token',
            $validated['expo_push_token']
        )->first();

        if ($subscription) {
            $subscription->update([
                'user_id' => $user->id,
                'platform' => $validated['platform'],
                'device_name' => $validated['device_name'] ?? null,
                'last_used_at' => now(),
            ]);

            return response()->json([
                'message' => 'Mobile push subscription updated',
                'subscription_id' => $subscription->id,
            ]);
        }

        $subscription = MobilePushSubscription::create([
            'user_id' => $user->id,
            'expo_push_token' => $validated['expo_push_token'],
            'platform' => $validated['platform'],
            'device_name' => $validated['device_name'] ?? null,
        ]);

        return response()->json([
            'message' => 'Mobile push subscription created',
            'subscription_id' => $subscription->id,
        ], 201);
    }

    public function unsubscribe(UnsubscribeMobilePushRequest $request): JsonResponse
    {
        $deleted = MobilePushSubscription::where('user_id', Auth::id())
            ->where('expo_push_token', $request->validated('expo_push_token'))
            ->delete();

        if ($deleted === 0) {
            return response()->json(['message' => 'Mobile push subscription not found'], 404);
        }

        return response()->json(['message' => 'Mobile push subscription removed']);
    }

    public function destroy(MobilePushSubscription $subscription): JsonResponse
    {
        if ((string) $subscription->user_id !== (string) Auth::id()) {
            abort(403, 'You can only remove your own mobile push subscriptions');
        }

        $subscription->delete();

        return response()->json(['message' => 'Mobile push subscription removed']);
    }
}

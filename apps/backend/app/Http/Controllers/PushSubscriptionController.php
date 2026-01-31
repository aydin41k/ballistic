<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\PushSubscription;
use App\Services\WebPushService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * Controller for managing Web Push subscriptions.
 */
final class PushSubscriptionController extends Controller
{
    public function __construct(
        private readonly WebPushService $webPushService
    ) {}

    /**
     * Get the VAPID public key for client-side subscription.
     */
    public function vapidKey(): JsonResponse
    {
        $publicKey = $this->webPushService->getPublicKey();

        if (! $publicKey) {
            return response()->json([
                'error' => 'Web Push is not configured',
            ], 503);
        }

        return response()->json([
            'public_key' => $publicKey,
        ]);
    }

    /**
     * Subscribe to push notifications.
     */
    public function subscribe(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'endpoint' => ['required', 'string', 'url', 'max:500'],
            'keys.p256dh' => ['required', 'string', 'max:100'],
            'keys.auth' => ['required', 'string', 'max:50'],
        ]);

        $user = Auth::user();

        // Check if subscription already exists for this endpoint
        $existing = PushSubscription::where('endpoint', $validated['endpoint'])->first();

        if ($existing) {
            // Update existing subscription (may have new keys)
            $existing->update([
                'user_id' => $user->id,
                'p256dh_key' => $validated['keys']['p256dh'],
                'auth_key' => $validated['keys']['auth'],
                'user_agent' => $request->userAgent(),
                'last_used_at' => now(),
            ]);

            return response()->json([
                'message' => 'Subscription updated',
                'subscription_id' => $existing->id,
            ]);
        }

        // Create new subscription
        $subscription = PushSubscription::create([
            'user_id' => $user->id,
            'endpoint' => $validated['endpoint'],
            'p256dh_key' => $validated['keys']['p256dh'],
            'auth_key' => $validated['keys']['auth'],
            'user_agent' => $request->userAgent(),
        ]);

        return response()->json([
            'message' => 'Subscription created',
            'subscription_id' => $subscription->id,
        ], 201);
    }

    /**
     * Unsubscribe from push notifications.
     */
    public function unsubscribe(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'endpoint' => ['required', 'string', 'url', 'max:500'],
        ]);

        $user = Auth::user();

        $deleted = PushSubscription::where('user_id', $user->id)
            ->where('endpoint', $validated['endpoint'])
            ->delete();

        if ($deleted === 0) {
            return response()->json([
                'message' => 'Subscription not found',
            ], 404);
        }

        return response()->json([
            'message' => 'Subscription removed',
        ]);
    }

    /**
     * List user's push subscriptions.
     */
    public function index(): JsonResponse
    {
        $user = Auth::user();

        $subscriptions = $user->pushSubscriptions()
            ->select(['id', 'endpoint', 'user_agent', 'last_used_at', 'created_at'])
            ->orderByDesc('last_used_at')
            ->get()
            ->map(fn (PushSubscription $sub) => [
                'id' => $sub->id,
                'endpoint_domain' => parse_url($sub->endpoint, PHP_URL_HOST),
                'user_agent' => $sub->user_agent,
                'last_used_at' => $sub->last_used_at?->toIso8601String(),
                'created_at' => $sub->created_at->toIso8601String(),
            ]);

        return response()->json([
            'subscriptions' => $subscriptions,
            'count' => $subscriptions->count(),
        ]);
    }

    /**
     * Remove a specific subscription by ID.
     */
    public function destroy(PushSubscription $subscription): JsonResponse
    {
        $user = Auth::user();

        if ((string) $subscription->user_id !== (string) $user->id) {
            abort(403, 'You can only remove your own subscriptions');
        }

        $subscription->delete();

        return response()->json([
            'message' => 'Subscription removed',
        ]);
    }
}

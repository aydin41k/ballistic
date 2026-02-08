<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Resources\UserLookupResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * Controller for discovering users to connect with.
 *
 * This is separate from UserLookupController which is used for task assignment
 * and only returns connected users. This controller allows searching for any
 * user by exact email or phone number to send connection requests.
 */
final class UserDiscoveryController extends Controller
{
    /**
     * Search for a user by exact email or phone number.
     *
     * Returns a single user if found, or a not found response.
     * Does not allow browsing - requires exact match.
     */
    public function __invoke(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required_without:phone', 'nullable', 'email', 'max:255'],
            'phone' => ['required_without:email', 'nullable', 'string', 'min:9', 'max:20'],
        ]);

        $currentUserId = Auth::id();

        $user = null;

        // Search by case-insensitive exact email
        if (! empty($validated['email'])) {
            $user = User::whereRaw('LOWER(email) = LOWER(?)', [strtolower($validated['email'])])
                ->where('id', '!=', $currentUserId)
                ->first();
        }

        // Search by phone number (match last 9 digits)
        if ($user === null && ! empty($validated['phone'])) {
            $phoneDigits = preg_replace('/[^0-9]/', '', $validated['phone']);

            if (strlen($phoneDigits) >= 9) {
                $phoneSuffix = substr($phoneDigits, -9);

                // Find users with matching phone suffix
                $user = User::where('id', '!=', $currentUserId)
                    ->whereNotNull('phone')
                    ->get()
                    ->first(function ($u) use ($phoneSuffix) {
                        $userPhoneDigits = preg_replace('/[^0-9]/', '', $u->phone ?? '');
                        $userSuffix = strlen($userPhoneDigits) >= 9 ? substr($userPhoneDigits, -9) : $userPhoneDigits;

                        return $userSuffix === $phoneSuffix;
                    });
            }
        }

        if ($user === null) {
            return response()->json([
                'found' => false,
                'message' => 'No user found with that email or phone number.',
            ]);
        }

        return response()->json([
            'found' => true,
            'user' => new UserLookupResource($user),
        ]);
    }
}

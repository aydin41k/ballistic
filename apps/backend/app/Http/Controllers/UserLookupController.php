<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Resources\UserLookupResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Auth;

final class UserLookupController extends Controller
{
    /**
     * Search for users by email or phone suffix.
     *
     * Searches by exact email match OR last 9 digits of phone number.
     * Only returns users who are connected with the current user.
     * Excludes the current user from results.
     */
    public function __invoke(Request $request): AnonymousResourceCollection
    {
        $validated = $request->validate([
            'q' => ['required', 'string', 'min:3', 'max:255'],
        ]);

        $query = $validated['q'];
        /** @var User $currentUser */
        $currentUser = Auth::user();

        // Get all connected user IDs for filtering
        $connectedUserIds = $currentUser->connections()->pluck('id')->toArray();

        // If the user has no connections, return empty
        if (empty($connectedUserIds)) {
            return UserLookupResource::collection(collect());
        }

        // Clean the query - remove spaces and special characters for phone matching
        $cleanedQuery = preg_replace('/[^0-9]/', '', $query);

        // Get the last 9 digits for phone suffix matching
        $phoneSuffix = strlen($cleanedQuery) >= 9 ? substr($cleanedQuery, -9) : $cleanedQuery;

        // First try exact email match (only among connected users)
        $users = User::whereIn('id', $connectedUserIds)
            ->where('email', $query)
            ->limit(10)
            ->get();

        // If no email match and we have a valid phone suffix, search by phone
        if ($users->isEmpty() && strlen($phoneSuffix) >= 9) {
            // Get connected users with phones and filter by suffix in PHP
            // This handles phones with various formatting (spaces, dashes, etc.)
            $users = User::whereIn('id', $connectedUserIds)
                ->whereNotNull('phone')
                ->get()
                ->filter(function (User $user) use ($phoneSuffix): bool {
                    // Extract digits only from phone and get last 9
                    $phoneDigits = preg_replace('/[^0-9]/', '', $user->phone ?? '');
                    $userSuffix = strlen($phoneDigits) >= 9 ? substr($phoneDigits, -9) : $phoneDigits;

                    return $userSuffix === $phoneSuffix;
                })
                ->take(10);
        }

        return UserLookupResource::collection($users);
    }
}

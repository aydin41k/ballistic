<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserLookupResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class FavouriteController extends Controller
{
    /**
     * Toggle a user as a favourite contact.
     *
     * POST /api/favourites/{user}
     *
     * Returns the updated favourite status and the full favourites list.
     */
    public function toggle(Request $request, User $user): JsonResponse
    {
        /** @var User $currentUser */
        $currentUser = $request->user();

        if ((string) $currentUser->id === (string) $user->id) {
            return response()->json([
                'message' => 'You cannot favourite yourself.',
            ], 422);
        }

        $userId = (string) $user->id;
        $isFavourite = $currentUser->favourites()->where('favourite_id', $userId)->exists();

        if ($isFavourite) {
            $currentUser->favourites()->detach($userId);
            $isFavourite = false;
        } else {
            $currentUser->favourites()->attach($userId);
            $isFavourite = true;
        }

        $favourites = $currentUser->favourites()->get();

        return response()->json([
            'is_favourite' => $isFavourite,
            'favourites' => UserLookupResource::collection($favourites),
        ]);
    }
}

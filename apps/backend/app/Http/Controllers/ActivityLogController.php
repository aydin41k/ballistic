<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Resources\ActivityLogItemResource;
use App\Models\Item;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

final class ActivityLogController extends Controller
{
    /**
     * Get cursor-paginated item history for the authenticated user.
     *
     * Items are ordered by updated_at descending (most recent first).
     * Supports cursor pagination for infinite scroll.
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = min((int) $request->input('per_page', 20), 50);

        $items = Item::where('user_id', Auth::id())
            ->with('project')
            ->orderBy('updated_at', 'desc')
            ->cursorPaginate($perPage);

        return ActivityLogItemResource::collection($items)
            ->response();
    }
}

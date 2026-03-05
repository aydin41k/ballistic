<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ActivityLogItemResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Chronological feed of closed items (done / won't do) for the
 * authenticated user.
 *
 * Query cost: a single indexed SELECT per request. The composite index
 * items_user_status_updated_idx (user_id, status, updated_at) fully covers
 * the WHERE + ORDER BY, so there's no filesort even on very large item sets.
 * Project is eager-loaded so the timeline can colour-code entries without N+1.
 */
final class ActivityLogController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $perPage = min((int) $request->integer('per_page', 20), 100);

        $items = $user->items()
            ->closed()
            ->with('project:id,name,color')
            ->orderByDesc('updated_at')
            // Stable secondary sort so pagination cursors don't skip / duplicate
            // rows when multiple items share the same updated_at.
            ->orderByDesc('id')
            ->cursorPaginate($perPage);

        return response()->json([
            'data' => ActivityLogItemResource::collection($items->items()),
            'next_cursor' => $items->nextCursor()?->encode(),
            'has_more' => $items->hasMorePages(),
        ]);
    }
}

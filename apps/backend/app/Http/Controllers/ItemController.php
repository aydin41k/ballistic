<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\StoreItemRequest;
use App\Http\Requests\UpdateItemRequest;
use App\Http\Resources\ItemResource;
use App\Models\Item;
use App\Services\RecurrenceService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

final class ItemController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        // Auto-expire recurring instances whose scheduled_date has passed
        // and whose strategy is 'expires'. Only instances (not templates).
        Item::where('user_id', Auth::id())
            ->where('recurrence_strategy', 'expires')
            ->whereNotNull('recurrence_parent_id')
            ->whereNotNull('scheduled_date')
            ->whereDate('scheduled_date', '<', now()->toDateString())
            ->whereIn('status', ['todo', 'doing'])
            ->update(['status' => 'wontdo', 'updated_at' => now()]);

        $query = Item::where('user_id', Auth::id())
            ->with(['project', 'tags'])
            ->orderBy('position');

        // Apply scheduling scope: hide future-scheduled items by default
        $scope = $request->input('scope', 'active');
        if (!in_array($scope, ['active', 'planned', 'all'], true)) {
            $scope = 'active';
        }

        if ($scope === 'planned') {
            $query->planned();
        } elseif ($scope === 'all') {
            // No scope filter — return everything
        } else {
            // Default: only show active items (no future scheduled_date)
            $query->active();
        }

        if ($request->has('project_id')) {
            $query->where('project_id', $request->project_id);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('tag_id')) {
            $query->whereHas('tags', function ($q) use ($request) {
                $q->where('tags.id', $request->tag_id);
            });
        }

        // Date filtering
        if ($request->has('scheduled_date')) {
            $query->whereDate('scheduled_date', $request->scheduled_date);
        }

        if ($request->has('scheduled_from')) {
            $query->whereDate('scheduled_date', '>=', $request->scheduled_from);
        }

        if ($request->has('scheduled_to')) {
            $query->whereDate('scheduled_date', '<=', $request->scheduled_to);
        }

        if ($request->has('due_from')) {
            $query->whereDate('due_date', '>=', $request->due_from);
        }

        if ($request->has('due_to')) {
            $query->whereDate('due_date', '<=', $request->due_to);
        }

        if ($request->boolean('overdue')) {
            $query->whereNotNull('due_date')
                ->whereDate('due_date', '<', now())
                ->whereNotIn('status', ['done', 'wontdo']);
        }

        $items = $query->get();

        return ItemResource::collection($items);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreItemRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $tagIds = $validated['tag_ids'] ?? [];
        unset($validated['tag_ids']);

        // Auto-set completed_at if status is 'done'
        if (($validated['status'] ?? null) === 'done') {
            $validated['completed_at'] = now();
        }

        $item = DB::transaction(function () use ($validated, $tagIds): Item {
            $item = Item::create([
                ...$validated,
                'user_id' => Auth::id(),
                'position' => $validated['position'] ?? 0,
            ]);

            if (!empty($tagIds)) {
                $item->tags()->sync($tagIds);
            }

            return $item;
        });

        $item->load(['project', 'tags']);

        return (new ItemResource($item))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    /**
     * Display the specified resource.
     */
    public function show(Item $item): ItemResource
    {
        $this->authorize('view', $item);

        $item->load(['project', 'tags']);

        return new ItemResource($item);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateItemRequest $request, Item $item): ItemResource
    {
        $this->authorize('update', $item);

        $validated = $request->validated();
        $tagIds = $validated['tag_ids'] ?? null;
        unset($validated['tag_ids']);

        // Auto-manage completed_at based on status changes
        if (isset($validated['status'])) {
            if ($validated['status'] === 'done' && $item->status !== 'done') {
                $validated['completed_at'] = now();
            } elseif ($validated['status'] !== 'done' && $item->status === 'done') {
                $validated['completed_at'] = null;
            }
        }

        DB::transaction(function () use ($item, $validated, $tagIds): void {
            $item->update($validated);

            if ($tagIds !== null) {
                $item->tags()->sync($tagIds);
            }
        });

        $item->load(['project', 'tags']);

        return new ItemResource($item);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Item $item): JsonResponse
    {
        $this->authorize('delete', $item);

        $item->delete();

        return response()->json(null, Response::HTTP_NO_CONTENT);
    }

    /**
     * Reorder items by updating their positions.
     */
    public function reorder(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'items' => ['required', 'array', 'max:100'],
            'items.*.id' => ['required', 'uuid'],
            'items.*.position' => ['required', 'integer', 'min:0', 'max:9999'],
        ]);

        DB::transaction(function () use ($validated): void {
            $submittedIds = array_column($validated['items'], 'id');

            // Collect only items owned by this user in a single query
            $ownedIds = Item::where('user_id', Auth::id())
                ->whereIn('id', $submittedIds)
                ->pluck('id')
                ->flip();

            $maxPosition = -1;

            foreach ($validated['items'] as $itemData) {
                if ($ownedIds->has($itemData['id'])) {
                    Item::where('id', $itemData['id'])
                        ->update(['position' => $itemData['position']]);

                    if ($itemData['position'] > $maxPosition) {
                        $maxPosition = $itemData['position'];
                    }
                }
            }

            // Renumber non-submitted items to positions after the submitted range.
            // This prevents position double-ups with completed/cancelled items
            // that the client filters out before reordering.
            $otherItemIds = Item::where('user_id', Auth::id())
                ->whereNotIn('id', $submittedIds)
                ->orderBy('position')
                ->pluck('id');

            $nextPosition = $maxPosition + 1;

            foreach ($otherItemIds as $otherId) {
                Item::where('id', $otherId)
                    ->update(['position' => $nextPosition++]);
            }
        });

        return response()->json(['message' => 'Items reordered successfully']);
    }

    /**
     * Generate recurring instances for a recurring item template.
     */
    public function generateRecurrences(Request $request, Item $item, RecurrenceService $recurrenceService): AnonymousResourceCollection
    {
        $this->authorize('update', $item);

        if (!$item->isRecurringTemplate()) {
            abort(Response::HTTP_BAD_REQUEST, 'This item is not a recurring template.');
        }

        $validated = $request->validate([
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
        ]);

        $instances = $recurrenceService->generateInstances(
            $item,
            Carbon::parse($validated['start_date']),
            Carbon::parse($validated['end_date'])
        );

        foreach ($instances as $instance) {
            $instance->load(['project', 'tags']);
        }

        return ItemResource::collection(collect($instances));
    }
}

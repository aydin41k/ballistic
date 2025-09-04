<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Item;
use App\Models\Project;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

final class ItemController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Item::where('user_id', Auth::id())
            ->with(['project'])
            ->orderBy('position');

        if ($request->has('project_id')) {
            $query->where('project_id', $request->project_id);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $items = $query->get();

        return response()->json($items);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:65535',
            'description' => 'nullable|string|max:65535',
            'status' => ['required', Rule::in(['todo', 'doing', 'done', 'wontdo'])],
            'project_id' => 'nullable|exists:projects,id',
            'position' => 'integer|min:0',
        ]);

        // Ensure the project belongs to the authenticated user
        if ($validated['project_id']) {
            $project = Project::where('id', $validated['project_id'])
                ->where('user_id', Auth::id())
                ->firstOrFail();
        }

        $item = Item::create([
            ...$validated,
            'user_id' => Auth::id(),
            'position' => $validated['position'] ?? 0,
        ]);

        $item->load('project');

        return response()->json($item, Response::HTTP_CREATED);
    }

    /**
     * Display the specified resource.
     */
    public function show(Item $item): JsonResponse
    {
        $this->authorize('view', $item);

        $item->load('project');

        return response()->json($item);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Item $item): JsonResponse
    {
        $this->authorize('update', $item);

        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:65535',
            'description' => 'nullable|string|max:65535',
            'status' => ['sometimes', 'required', Rule::in(['todo', 'doing', 'done', 'wontdo'])],
            'project_id' => 'nullable|exists:projects,id',
            'position' => 'sometimes|integer|min:0',
        ]);

        // Ensure the project belongs to the authenticated user
        if (isset($validated['project_id']) && $validated['project_id']) {
            $project = Project::where('id', $validated['project_id'])
                ->where('user_id', Auth::id())
                ->firstOrFail();
        }

        $item->update($validated);
        $item->load('project');

        return response()->json($item);
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
}

<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\StoreProjectRequest;
use App\Http\Requests\UpdateProjectRequest;
use App\Http\Resources\ProjectResource;
use App\Models\Project;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;

final class ProjectController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Project::where('user_id', Auth::id())
            ->orderBy('name');

        if ($request->boolean('include_archived')) {
            // Include archived projects
        } else {
            $query->whereNull('archived_at');
        }

        $projects = $query->get();

        return ProjectResource::collection($projects);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreProjectRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $project = Project::create([
            ...$validated,
            'user_id' => Auth::id(),
        ]);

        return (new ProjectResource($project))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    /**
     * Display the specified resource.
     */
    public function show(Project $project): ProjectResource
    {
        $this->authorize('view', $project);

        $project->load('items');

        return new ProjectResource($project);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateProjectRequest $request, Project $project): ProjectResource
    {
        $this->authorize('update', $project);

        $validated = $request->validated();

        $project->update($validated);

        return new ProjectResource($project);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Project $project): JsonResponse
    {
        $this->authorize('delete', $project);

        $project->delete();

        return response()->json(null, Response::HTTP_NO_CONTENT);
    }

    /**
     * Archive the specified project.
     */
    public function archive(Project $project): ProjectResource
    {
        $this->authorize('update', $project);

        $project->update(['archived_at' => now()]);

        return new ProjectResource($project);
    }

    /**
     * Restore the specified project from archive.
     */
    public function restore(Project $project): ProjectResource
    {
        $this->authorize('update', $project);

        $project->update(['archived_at' => null]);

        return new ProjectResource($project);
    }
}

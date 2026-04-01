<?php

declare(strict_types=1);

namespace App\Mcp\Resources;

use App\Mcp\Services\McpAuthContext;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Contracts\HasUriTemplate;
use Laravel\Mcp\Server\Resource;
use Laravel\Mcp\Support\UriTemplate;

/**
 * MCP Resource for a single project.
 */
final class ProjectResource extends Resource implements HasUriTemplate
{
    protected string $description = 'Detailed information about a specific project including its items.';

    public function __construct(
        private readonly McpAuthContext $auth
    ) {}

    public function name(): string
    {
        return 'project-detail';
    }

    public function title(): string
    {
        return 'Project Detail';
    }

    public function uriTemplate(): UriTemplate
    {
        return new UriTemplate('ballistic://projects/{projectId}');
    }

    public function mimeType(): string
    {
        return 'application/json';
    }

    public function handle(Request $request): Response
    {
        $projectId = $request->string('projectId')->toString();

        if ($projectId === '') {
            return Response::json([
                'error' => 'Project ID required. Use the URI template: ballistic://projects/{projectId}',
            ]);
        }

        $project = $this->auth->getProject($projectId);

        if ($project === null) {
            return Response::json([
                'error' => "Project not found or access denied: {$projectId}",
            ]);
        }

        $project->load('items');

        $data = [
            'id' => $project->id,
            'name' => $project->name,
            'color' => $project->color,
            'archived_at' => $project->archived_at?->toIso8601String(),
            'created_at' => $project->created_at->toIso8601String(),
            'updated_at' => $project->updated_at->toIso8601String(),
            'item_count' => $project->items->count(),

            // Item counts by status
            'item_counts' => [
                'total' => $project->items->count(),
                'todo' => $project->items->where('status', 'todo')->count(),
                'doing' => $project->items->where('status', 'doing')->count(),
                'done' => $project->items->where('status', 'done')->count(),
                'wontdo' => $project->items->where('status', 'wontdo')->count(),
            ],

            // Recent items (non-completed, sorted by position)
            'items' => $project->items
                ->whereIn('status', ['todo', 'doing'])
                ->sortBy('position')
                ->take(25)
                ->map(fn ($item) => [
                    'id' => $item->id,
                    'title' => $item->title,
                    'status' => $item->status,
                    'position' => $item->position,
                    'due_date' => $item->due_date?->format('Y-m-d'),
                    'assignee_id' => $item->assignee_id,
                ])->values()->toArray(),
        ];

        return Response::json($data);
    }
}

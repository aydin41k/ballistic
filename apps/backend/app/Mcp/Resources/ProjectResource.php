<?php

declare(strict_types=1);

namespace App\Mcp\Resources;

use App\Mcp\Services\McpAuthContext;
use Laravel\Mcp\Server\Resource;

/**
 * MCP Resource for a single project.
 */
final class ProjectResource extends Resource
{
    protected string $description = 'Detailed information about a specific project including its items.';

    private ?string $projectId = null;

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

    public function uri(): string
    {
        return 'ballistic://projects/{projectId}';
    }

    public function mimeType(): string
    {
        return 'application/json';
    }

    /**
     * Set the project ID for this resource.
     */
    public function withProjectId(string $projectId): self
    {
        $clone = clone $this;
        $clone->projectId = $projectId;

        return $clone;
    }

    public function read(): string
    {
        if ($this->projectId === null) {
            return json_encode([
                'error' => 'Project ID required. Use the URI template: ballistic://projects/{projectId}',
            ], JSON_THROW_ON_ERROR);
        }

        $project = $this->auth->getProject($this->projectId);

        if ($project === null) {
            return json_encode([
                'error' => "Project not found or access denied: {$this->projectId}",
            ], JSON_THROW_ON_ERROR);
        }

        $project->load('items');

        $data = [
            'id' => $project->id,
            'name' => $project->name,
            'color' => $project->color,
            'archived_at' => $project->archived_at?->toIso8601String(),
            'created_at' => $project->created_at->toIso8601String(),
            'updated_at' => $project->updated_at->toIso8601String(),

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

        return json_encode($data, JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR);
    }
}

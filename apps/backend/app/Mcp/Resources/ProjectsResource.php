<?php

declare(strict_types=1);

namespace App\Mcp\Resources;

use App\Mcp\Services\McpAuthContext;
use Laravel\Mcp\Server\Resource;

/**
 * MCP Resource for listing all projects.
 */
final class ProjectsResource extends Resource
{
    protected string $description = 'List of all projects owned by the authenticated user.';

    public function __construct(
        private readonly McpAuthContext $auth
    ) {}

    public function name(): string
    {
        return 'projects-list';
    }

    public function title(): string
    {
        return 'Projects';
    }

    public function uri(): string
    {
        return 'ballistic://projects';
    }

    public function mimeType(): string
    {
        return 'application/json';
    }

    public function read(): string
    {
        // Include archived projects with separate flag
        $activeProjects = $this->auth->getProjects(includeArchived: false);
        $archivedProjects = $this->auth->getProjects(includeArchived: true)
            ->filter(fn ($p) => $p->archived_at !== null);

        $mapProject = fn ($project) => [
            'id' => $project->id,
            'name' => $project->name,
            'color' => $project->color,
            'archived_at' => $project->archived_at?->toIso8601String(),
            'items_count' => $project->items()->count(),
            'active_items_count' => $project->items()->whereIn('status', ['todo', 'doing'])->count(),
            'created_at' => $project->created_at->toIso8601String(),
            'updated_at' => $project->updated_at->toIso8601String(),
        ];

        $data = [
            'active' => [
                'count' => $activeProjects->count(),
                'projects' => $activeProjects->map($mapProject)->toArray(),
            ],
            'archived' => [
                'count' => $archivedProjects->count(),
                'projects' => $archivedProjects->map($mapProject)->toArray(),
            ],
        ];

        return json_encode($data, JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR);
    }
}

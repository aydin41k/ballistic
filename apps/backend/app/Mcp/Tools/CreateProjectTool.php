<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use App\Mcp\Services\McpAuthContext;
use App\Models\Project;
use Generator;
use Laravel\Mcp\Server\Tool;
use Laravel\Mcp\Server\Tools\Annotations\IsIdempotent;
use Laravel\Mcp\Server\Tools\ToolInputSchema;
use Laravel\Mcp\Server\Tools\ToolResult;

/**
 * Create a new project.
 */
#[IsIdempotent]
final class CreateProjectTool extends Tool
{
    public function __construct(
        private readonly McpAuthContext $auth
    ) {}

    public function name(): string
    {
        return 'create_project';
    }

    public function description(): string
    {
        return 'Create a new project for organising todo items.';
    }

    public function schema(ToolInputSchema $schema): ToolInputSchema
    {
        return $schema
            ->string('name')
            ->description('The name of the project (required)')
            ->required()
            ->string('color')
            ->description('Hex colour code for the project (e.g., #FF5733). Optional.');
    }

    public function handle(array $arguments): ToolResult|Generator
    {
        try {
            $user = $this->auth->user();

            // Validate colour format if provided
            if (isset($arguments['color']) && ! preg_match('/^#[0-9A-Fa-f]{6}$/', $arguments['color'])) {
                return ToolResult::error('Invalid colour format. Use hex format: #RRGGBB');
            }

            // Create the project
            $project = Project::create([
                'user_id' => $user->id,
                'name' => $arguments['name'],
                'color' => $arguments['color'] ?? null,
            ]);

            // Log the action
            $this->auth->logAction('create_project', 'project', (string) $project->id, 'success', [
                'name' => $project->name,
            ]);

            return ToolResult::json([
                'success' => true,
                'project' => [
                    'id' => $project->id,
                    'name' => $project->name,
                    'color' => $project->color,
                    'created_at' => $project->created_at->toIso8601String(),
                ],
            ]);
        } catch (\Throwable $e) {
            $this->auth->logAction('create_project', 'project', null, 'error', [
                'error' => $e->getMessage(),
            ]);

            return ToolResult::error("Failed to create project: {$e->getMessage()}");
        }
    }
}

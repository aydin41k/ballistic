<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use App\Mcp\Services\McpAuthContext;
use Generator;
use Laravel\Mcp\Server\Tool;
use Laravel\Mcp\Server\Tools\Annotations\IsIdempotent;
use Laravel\Mcp\Server\Tools\ToolInputSchema;
use Laravel\Mcp\Server\Tools\ToolResult;

/**
 * Update or archive a project.
 */
#[IsIdempotent]
final class UpdateProjectTool extends Tool
{
    public function __construct(
        private readonly McpAuthContext $auth
    ) {}

    public function name(): string
    {
        return 'update_project';
    }

    public function description(): string
    {
        return 'Update a project name, colour, or archive/restore it.';
    }

    public function schema(ToolInputSchema $schema): ToolInputSchema
    {
        return $schema
            ->string('id')
            ->description('The UUID of the project to update (required)')
            ->required()
            ->string('name')
            ->description('New name for the project')
            ->string('color')
            ->description('New hex colour code (e.g., #FF5733), or null to remove')
            ->boolean('archived')
            ->description('Set to true to archive, false to restore');
    }

    public function handle(array $arguments): ToolResult|Generator
    {
        try {
            // Get the project
            $project = $this->auth->getProject($arguments['id']);

            if ($project === null) {
                return ToolResult::error("Project not found or access denied: {$arguments['id']}");
            }

            // Validate colour format if provided
            if (isset($arguments['color']) && $arguments['color'] !== null && ! preg_match('/^#[0-9A-Fa-f]{6}$/', $arguments['color'])) {
                return ToolResult::error('Invalid colour format. Use hex format: #RRGGBB');
            }

            // Prepare update data
            $updateData = [];

            if (isset($arguments['name'])) {
                $updateData['name'] = $arguments['name'];
            }

            if (array_key_exists('color', $arguments)) {
                $updateData['color'] = $arguments['color'];
            }

            if (isset($arguments['archived'])) {
                $updateData['archived_at'] = $arguments['archived'] ? now() : null;
            }

            // Update the project
            $project->update($updateData);

            // Log the action
            $action = isset($arguments['archived']) ? ($arguments['archived'] ? 'archive_project' : 'restore_project') : 'update_project';
            $this->auth->logAction($action, 'project', (string) $project->id, 'success', [
                'name' => $project->name,
            ]);

            return ToolResult::json([
                'success' => true,
                'project' => [
                    'id' => $project->id,
                    'name' => $project->name,
                    'color' => $project->color,
                    'archived_at' => $project->archived_at?->toIso8601String(),
                    'updated_at' => $project->updated_at->toIso8601String(),
                ],
            ]);
        } catch (\Throwable $e) {
            $this->auth->logAction('update_project', 'project', $arguments['id'] ?? null, 'error', [
                'error' => $e->getMessage(),
            ]);

            return ToolResult::error("Failed to update project: {$e->getMessage()}");
        }
    }
}

<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use App\Mcp\Services\McpAuthContext;
use Generator;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Tool;
use Laravel\Mcp\Server\Tools\Annotations\IsIdempotent;

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

    public function schema(JsonSchema $schema): array
    {
        return [
            'id' => $schema->string()
                ->description('The UUID of the project to update.')
                ->required(),
            'name' => $schema->string()
                ->description('New name for the project.'),
            'color' => $schema->string()
                ->description('New hex colour code such as #FF5733, or null to remove it.')
                ->nullable(),
            'archived' => $schema->boolean()
                ->description('Set to true to archive the project or false to restore it.'),
        ];
    }

    public function handle(Request $request): Response|Generator
    {
        try {
            $arguments = $request->all();
            // Get the project
            $project = $this->auth->getProject($arguments['id']);

            if ($project === null) {
                return Response::error("Project not found or access denied: {$arguments['id']}");
            }

            // Validate colour format if provided
            if (isset($arguments['color']) && $arguments['color'] !== null && ! preg_match('/^#[0-9A-Fa-f]{6}$/', $arguments['color'])) {
                return Response::error('Invalid colour format. Use hex format: #RRGGBB');
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

            return Response::json([
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

            return Response::error("Failed to update project: {$e->getMessage()}");
        }
    }
}

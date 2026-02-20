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
 * Mark a todo item as complete.
 */
#[IsIdempotent]
final class CompleteItemTool extends Tool
{
    public function __construct(
        private readonly McpAuthContext $auth
    ) {}

    public function name(): string
    {
        return 'complete_item';
    }

    public function description(): string
    {
        return 'Mark a todo item as complete (status: done). Both owners and assignees can complete items.';
    }

    public function schema(ToolInputSchema $schema): ToolInputSchema
    {
        return $schema
            ->string('id')
            ->description('The UUID of the item to complete (required)')
            ->required()
            ->string('assignee_notes')
            ->description('Optional notes to add when completing (useful for assignees to provide context)');
    }

    public function handle(array $arguments): ToolResult|Generator
    {
        try {
            // Get the item
            $item = $this->auth->getItem($arguments['id']);

            if ($item === null) {
                return ToolResult::error("Item not found or access denied: {$arguments['id']}");
            }

            // Check update permission
            if (! $this->auth->canUpdateItem($item)) {
                return ToolResult::error('You do not have permission to complete this item');
            }

            // Check if already completed
            if ($item->status === 'done') {
                return ToolResult::json([
                    'success' => true,
                    'message' => 'Item is already marked as done',
                    'item' => [
                        'id' => $item->id,
                        'title' => $item->title,
                        'status' => $item->status,
                        'completed_at' => $item->completed_at?->toIso8601String(),
                    ],
                ]);
            }

            // Prepare update data
            $updateData = [
                'status' => 'done',
                'completed_at' => now(),
            ];

            // Add assignee notes if provided
            if (isset($arguments['assignee_notes'])) {
                $updateData['assignee_notes'] = $arguments['assignee_notes'];
            }

            // Update the item
            $item->update($updateData);

            // Log the action
            $this->auth->logAction('complete_item', 'item', (string) $item->id, 'success', [
                'title' => $item->title,
            ]);

            return ToolResult::json([
                'success' => true,
                'message' => 'Item marked as complete',
                'item' => [
                    'id' => $item->id,
                    'title' => $item->title,
                    'status' => $item->status,
                    'assignee_notes' => $item->assignee_notes,
                    'completed_at' => $item->completed_at->toIso8601String(),
                ],
            ]);
        } catch (\Throwable $e) {
            $this->auth->logAction('complete_item', 'item', $arguments['id'] ?? null, 'error', [
                'error' => $e->getMessage(),
            ]);

            return ToolResult::error("Failed to complete item: {$e->getMessage()}");
        }
    }
}

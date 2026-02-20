<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use App\Mcp\Services\McpAuthContext;
use Generator;
use Illuminate\Support\Facades\DB;
use Laravel\Mcp\Server\Tool;
use Laravel\Mcp\Server\Tools\Annotations\IsIdempotent;
use Laravel\Mcp\Server\Tools\ToolInputSchema;
use Laravel\Mcp\Server\Tools\ToolResult;

/**
 * Update an existing todo item.
 */
#[IsIdempotent]
final class UpdateItemTool extends Tool
{
    public function __construct(
        private readonly McpAuthContext $auth
    ) {}

    public function name(): string
    {
        return 'update_item';
    }

    public function description(): string
    {
        return 'Update an existing todo item. Owners can update all fields. Assignees can only update status and assignee_notes, or set assignee_id to null to reject the task.';
    }

    public function schema(ToolInputSchema $schema): ToolInputSchema
    {
        return $schema
            ->string('id')
            ->description('The UUID of the item to update (required)')
            ->required()
            ->string('title')
            ->description('New title for the item (owner only)')
            ->string('description')
            ->description('New description for the item (owner only)')
            ->string('project_id')
            ->description('UUID of the project to move this item to, or null for inbox (owner only)')
            ->raw('status', [
                'type' => 'string',
                'enum' => ['todo', 'doing', 'done', 'wontdo'],
                'description' => 'New status for the item',
            ])
            ->string('assignee_notes')
            ->description('Notes from the assignee (visible to both owner and assignee)')
            ->string('assignee_id')
            ->description('UUID of user to assign item to, or null to unassign. Assignees can only set this to null (self-unassignment). Owners can assign to any connected user.')
            ->string('scheduled_date')
            ->description('New scheduled date (ISO 8601 format: YYYY-MM-DD, owner only)')
            ->string('due_date')
            ->description('New due date (ISO 8601 format: YYYY-MM-DD, owner only)')
            ->string('recurrence_rule')
            ->description('New RRULE string (owner only)')
            ->raw('tag_ids', [
                'type' => 'array',
                'items' => ['type' => 'string'],
                'description' => 'Array of tag UUIDs to set on this item (owner only, replaces existing tags)',
            ])
            ->integer('position')
            ->description('New position for ordering (owner only)');
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
                return ToolResult::error('You do not have permission to update this item');
            }

            // Determine which fields are being updated
            // We must track all keys that were explicitly set, including those set to null
            // (e.g., assignee_id = null for self-unassignment)
            $fieldsBeingUpdated = [];
            foreach ($arguments as $key => $value) {
                if ($key !== 'id') {
                    $fieldsBeingUpdated[] = $key;
                }
            }

            // Check if assignee can update these specific fields
            if (! $this->auth->canUpdateItemFields($item, $fieldsBeingUpdated, $arguments)) {
                $isOwner = $this->auth->isItemOwner($item);
                $allowedFields = $isOwner ? 'all fields' : 'status and assignee_notes only';

                return ToolResult::error("You can only update {$allowedFields}. Attempted to update: ".implode(', ', $fieldsBeingUpdated));
            }

            // Validate project ownership if provided
            if (isset($arguments['project_id']) && $arguments['project_id'] !== null) {
                $project = $this->auth->getProject($arguments['project_id']);
                if ($project === null) {
                    return ToolResult::error("Project not found or access denied: {$arguments['project_id']}");
                }
            }

            // Validate assignee_id if provided and not null (owners assigning to others)
            if (array_key_exists('assignee_id', $arguments) && $arguments['assignee_id'] !== null) {
                // Only owners can assign to others
                if (! $this->auth->isItemOwner($item)) {
                    return ToolResult::error('Only item owners can assign to others');
                }
                // Must have a connection with the assignee
                if (! $this->auth->canAssignTo($arguments['assignee_id'])) {
                    return ToolResult::error("Cannot assign to user '{$arguments['assignee_id']}': No accepted connection exists");
                }
            }

            // Validate tag ownership if provided
            $tagIds = $arguments['tag_ids'] ?? null;
            if ($tagIds !== null) {
                foreach ($tagIds as $tagId) {
                    $tag = $this->auth->getTag($tagId);
                    if ($tag === null) {
                        return ToolResult::error("Tag not found or access denied: {$tagId}");
                    }
                }
            }

            // Prepare update data
            $updateData = [];
            $validFields = [
                'title', 'description', 'project_id', 'status',
                'assignee_notes', 'assignee_id', 'scheduled_date', 'due_date',
                'recurrence_rule', 'recurrence_strategy', 'position',
            ];

            foreach ($validFields as $field) {
                if (array_key_exists($field, $arguments)) {
                    $value = $arguments[$field];

                    // Handle date fields
                    if (in_array($field, ['scheduled_date', 'due_date']) && $value !== null) {
                        try {
                            $date = new \DateTimeImmutable($value);
                            $value = $date->format('Y-m-d');
                        } catch (\Exception) {
                            return ToolResult::error("Invalid {$field} format. Use ISO 8601 format: YYYY-MM-DD");
                        }
                    }

                    $updateData[$field] = $value;
                }
            }

            // Validate due_date >= scheduled_date if both are set
            $scheduledDate = $updateData['scheduled_date'] ?? $item->scheduled_date?->format('Y-m-d');
            $dueDate = $updateData['due_date'] ?? $item->due_date?->format('Y-m-d');

            if ($scheduledDate && $dueDate && $dueDate < $scheduledDate) {
                return ToolResult::error('due_date must be on or after scheduled_date');
            }

            // Track completion
            if (isset($updateData['status'])) {
                if (in_array($updateData['status'], ['done', 'wontdo']) && $item->completed_at === null) {
                    $updateData['completed_at'] = now();
                } elseif (in_array($updateData['status'], ['todo', 'doing']) && $item->completed_at !== null) {
                    $updateData['completed_at'] = null;
                }
            }

            // Update item and sync tags within a transaction
            DB::transaction(function () use ($item, $updateData, $tagIds): void {
                $item->update($updateData);

                // Update tags if provided
                if ($tagIds !== null) {
                    $item->tags()->sync($tagIds);
                }
            });

            // Reload relationships
            $item->refresh();
            $item->load(['project', 'tags', 'assignee', 'user']);

            // Log the action
            $this->auth->logAction('update_item', 'item', (string) $item->id, 'success', [
                'fields_updated' => $fieldsBeingUpdated,
            ]);

            return ToolResult::json([
                'success' => true,
                'item' => [
                    'id' => $item->id,
                    'title' => $item->title,
                    'description' => $item->description,
                    'status' => $item->status,
                    'project_id' => $item->project_id,
                    'project_name' => $item->project?->name,
                    'assignee_id' => $item->assignee_id,
                    'assignee_name' => $item->assignee?->name,
                    'assignee_notes' => $item->assignee_notes,
                    'scheduled_date' => $item->scheduled_date?->format('Y-m-d'),
                    'due_date' => $item->due_date?->format('Y-m-d'),
                    'completed_at' => $item->completed_at?->toIso8601String(),
                    'recurrence_rule' => $item->recurrence_rule,
                    'position' => $item->position,
                    'tags' => $item->tags->map(fn ($tag) => [
                        'id' => $tag->id,
                        'name' => $tag->name,
                    ])->toArray(),
                    'updated_at' => $item->updated_at->toIso8601String(),
                ],
            ]);
        } catch (\Throwable $e) {
            $this->auth->logAction('update_item', 'item', $arguments['id'] ?? null, 'error', [
                'error' => $e->getMessage(),
            ]);

            return ToolResult::error("Failed to update item: {$e->getMessage()}");
        }
    }
}

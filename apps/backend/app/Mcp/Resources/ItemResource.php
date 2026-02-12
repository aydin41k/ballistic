<?php

declare(strict_types=1);

namespace App\Mcp\Resources;

use App\Mcp\Services\McpAuthContext;
use App\Models\Item;
use Laravel\Mcp\Server\Resource;

/**
 * MCP Resource for a single item.
 *
 * This is a template resource that requires an item ID parameter.
 */
final class ItemResource extends Resource
{
    protected string $description = 'Detailed information about a specific todo item.';

    private ?string $itemId = null;

    public function __construct(
        private readonly McpAuthContext $auth
    ) {}

    public function name(): string
    {
        return 'item-detail';
    }

    public function title(): string
    {
        return 'Item Detail';
    }

    public function uri(): string
    {
        return 'ballistic://items/{itemId}';
    }

    public function mimeType(): string
    {
        return 'application/json';
    }

    /**
     * Set the item ID for this resource.
     */
    public function withItemId(string $itemId): self
    {
        $clone = clone $this;
        $clone->itemId = $itemId;

        return $clone;
    }

    public function read(): string
    {
        if ($this->itemId === null) {
            return json_encode([
                'error' => 'Item ID required. Use the URI template: ballistic://items/{itemId}',
            ], JSON_THROW_ON_ERROR);
        }

        $item = $this->auth->getItem($this->itemId);

        if ($item === null) {
            return json_encode([
                'error' => "Item not found or access denied: {$this->itemId}",
            ], JSON_THROW_ON_ERROR);
        }

        $item->load(['project', 'tags', 'assignee', 'user', 'recurrenceParent', 'recurrenceInstances']);
        $userId = $this->auth->user()->id;

        $data = [
            'id' => $item->id,
            'title' => $item->title,
            'description' => $item->description,
            'assignee_notes' => $item->assignee_notes,
            'status' => $item->status,
            'position' => $item->position,

            // Project
            'project' => $item->project ? [
                'id' => $item->project->id,
                'name' => $item->project->name,
                'color' => $item->project->color,
            ] : null,

            // Owner
            'owner' => [
                'id' => $item->user->id,
                'name' => $item->user->name,
                'email' => $item->user->email,
            ],

            // Assignee
            'assignee' => $item->assignee ? [
                'id' => $item->assignee->id,
                'name' => $item->assignee->name,
                'email' => $item->assignee->email,
            ] : null,

            // Permissions context
            'permissions' => [
                'is_owner' => (string) $item->user_id === (string) $userId,
                'is_assignee' => (string) $item->assignee_id === (string) $userId,
                'can_update_all_fields' => (string) $item->user_id === (string) $userId,
                'can_delete' => (string) $item->user_id === (string) $userId,
            ],

            // Dates
            'scheduled_date' => $item->scheduled_date?->format('Y-m-d'),
            'due_date' => $item->due_date?->format('Y-m-d'),
            'completed_at' => $item->completed_at?->toIso8601String(),

            // Recurrence
            'recurrence' => [
                'rule' => $item->recurrence_rule,
                'strategy' => $item->recurrence_strategy,
                'is_template' => $item->isRecurringTemplate(),
                'is_instance' => $item->isRecurringInstance(),
                'parent_id' => $item->recurrence_parent_id,
                'instance_count' => $item->recurrenceInstances->count(),
            ],

            // Tags
            'tags' => $item->tags->map(fn ($tag) => [
                'id' => $tag->id,
                'name' => $tag->name,
                'color' => $tag->color,
            ])->toArray(),

            // Timestamps
            'created_at' => $item->created_at->toIso8601String(),
            'updated_at' => $item->updated_at->toIso8601String(),
        ];

        return json_encode($data, JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR);
    }
}

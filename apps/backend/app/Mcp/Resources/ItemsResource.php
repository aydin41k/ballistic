<?php

declare(strict_types=1);

namespace App\Mcp\Resources;

use App\Mcp\Services\McpAuthContext;
use Laravel\Mcp\Server\Resource;

/**
 * MCP Resource for listing all accessible items.
 */
final class ItemsResource extends Resource
{
    protected string $description = 'List of all todo items accessible to the authenticated user (owned or assigned).';

    public function __construct(
        private readonly McpAuthContext $auth
    ) {}

    public function name(): string
    {
        return 'items-list';
    }

    public function title(): string
    {
        return 'Todo Items';
    }

    public function uri(): string
    {
        return 'ballistic://items';
    }

    public function mimeType(): string
    {
        return 'application/json';
    }

    public function read(): string
    {
        $items = $this->auth->getItems(['limit' => 100]);
        $userId = $this->auth->user()->id;

        $data = [
            'count' => $items->count(),
            'items' => $items->map(fn ($item) => [
                'id' => $item->id,
                'title' => $item->title,
                'description' => $item->description,
                'status' => $item->status,
                'position' => $item->position,
                'project_id' => $item->project_id,
                'project_name' => $item->project?->name,
                'assignee_id' => $item->assignee_id,
                'assignee_name' => $item->assignee?->name,
                'owner_id' => $item->user_id,
                'owner_name' => $item->user?->name,
                'is_owned' => (string) $item->user_id === (string) $userId,
                'is_assigned_to_me' => (string) $item->assignee_id === (string) $userId,
                'scheduled_date' => $item->scheduled_date?->format('Y-m-d'),
                'due_date' => $item->due_date?->format('Y-m-d'),
                'completed_at' => $item->completed_at?->toIso8601String(),
                'recurrence_rule' => $item->recurrence_rule,
                'tags' => $item->tags->pluck('name')->toArray(),
                'created_at' => $item->created_at->toIso8601String(),
                'updated_at' => $item->updated_at->toIso8601String(),
            ])->toArray(),
        ];

        return json_encode($data, JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR);
    }
}

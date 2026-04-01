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
 * MCP Resource for a single item.
 *
 * This is a template resource that requires an item ID parameter.
 */
final class ItemResource extends Resource implements HasUriTemplate
{
    protected string $description = 'Detailed information about a specific todo item.';

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

    public function uriTemplate(): UriTemplate
    {
        return new UriTemplate('ballistic://items/{itemId}');
    }

    public function mimeType(): string
    {
        return 'application/json';
    }

    public function handle(Request $request): Response
    {
        $itemId = $request->string('itemId')->toString();

        if ($itemId === '') {
            return Response::json([
                'error' => 'Item ID required. Use the URI template: ballistic://items/{itemId}',
            ]);
        }

        $item = $this->auth->getItem($itemId);

        if ($item === null) {
            return Response::json([
                'error' => "Item not found or access denied: {$itemId}",
            ]);
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

        return Response::json($data);
    }
}

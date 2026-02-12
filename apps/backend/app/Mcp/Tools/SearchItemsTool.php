<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use App\Mcp\Services\McpAuthContext;
use Generator;
use Laravel\Mcp\Server\Tool;
use Laravel\Mcp\Server\Tools\Annotations\IsIdempotent;
use Laravel\Mcp\Server\Tools\Annotations\IsReadOnly;
use Laravel\Mcp\Server\Tools\ToolInputSchema;
use Laravel\Mcp\Server\Tools\ToolResult;

/**
 * Search and filter todo items.
 */
#[IsReadOnly]
#[IsIdempotent]
final class SearchItemsTool extends Tool
{
    public function __construct(
        private readonly McpAuthContext $auth
    ) {}

    public function name(): string
    {
        return 'search_items';
    }

    public function description(): string
    {
        return 'Search and filter todo items. Returns items you own or are assigned to you. Use filters to narrow results.';
    }

    public function schema(ToolInputSchema $schema): ToolInputSchema
    {
        return $schema
            ->string('search')
            ->description('Text to search for in title and description')
            ->raw('scope', [
                'type' => 'string',
                'enum' => ['active', 'planned', 'all'],
                'description' => 'Filter by scope: active (today and past), planned (future scheduled), or all (default: all)',
            ])
            ->raw('status', [
                'oneOf' => [
                    ['type' => 'string', 'enum' => ['todo', 'doing', 'done', 'wontdo']],
                    ['type' => 'array', 'items' => ['type' => 'string', 'enum' => ['todo', 'doing', 'done', 'wontdo']]],
                ],
                'description' => 'Filter by status (single value or array)',
            ])
            ->string('project_id')
            ->description('Filter by project UUID, or "inbox" for items with no project')
            ->string('tag_id')
            ->description('Filter by tag UUID')
            ->boolean('assigned_to_me')
            ->description('If true, only show items assigned to you by others')
            ->boolean('delegated')
            ->description('If true, only show items you own but have assigned to others')
            ->string('scheduled_from')
            ->description('Filter items scheduled on or after this date (ISO 8601: YYYY-MM-DD)')
            ->string('scheduled_to')
            ->description('Filter items scheduled on or before this date (ISO 8601: YYYY-MM-DD)')
            ->string('due_from')
            ->description('Filter items due on or after this date (ISO 8601: YYYY-MM-DD)')
            ->string('due_to')
            ->description('Filter items due on or before this date (ISO 8601: YYYY-MM-DD)')
            ->integer('limit')
            ->description('Maximum number of items to return (default: 25, max: 100)');
    }

    public function handle(array $arguments): ToolResult|Generator
    {
        try {
            // Build filters from arguments
            $filters = [];

            $filterKeys = [
                'search', 'scope', 'status', 'project_id', 'tag_id',
                'assigned_to_me', 'delegated', 'scheduled_from', 'scheduled_to',
                'due_from', 'due_to', 'limit',
            ];

            foreach ($filterKeys as $key) {
                if (isset($arguments[$key])) {
                    $filters[$key] = $arguments[$key];
                }
            }

            // Validate date formats
            $dateFields = ['scheduled_from', 'scheduled_to', 'due_from', 'due_to'];
            foreach ($dateFields as $field) {
                if (isset($filters[$field])) {
                    try {
                        new \DateTimeImmutable($filters[$field]);
                    } catch (\Exception) {
                        return ToolResult::error("Invalid {$field} format. Use ISO 8601 format: YYYY-MM-DD");
                    }
                }
            }

            // Get items
            $items = $this->auth->getItems($filters);

            // Log the action
            $this->auth->logAction('search_items', 'item', null, 'success', [
                'filters' => $filters,
                'result_count' => $items->count(),
            ]);

            return ToolResult::json([
                'success' => true,
                'count' => $items->count(),
                'filters_applied' => $filters,
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
                    'is_assigned_to_me' => (string) $item->assignee_id === (string) $this->auth->user()->id,
                    'is_delegated' => $item->isDelegated($this->auth->user()),
                    'scheduled_date' => $item->scheduled_date?->format('Y-m-d'),
                    'due_date' => $item->due_date?->format('Y-m-d'),
                    'completed_at' => $item->completed_at?->toIso8601String(),
                    'recurrence_rule' => $item->recurrence_rule,
                    'tags' => $item->tags->map(fn ($tag) => [
                        'id' => $tag->id,
                        'name' => $tag->name,
                        'color' => $tag->color,
                    ])->toArray(),
                    'created_at' => $item->created_at->toIso8601String(),
                    'updated_at' => $item->updated_at->toIso8601String(),
                ])->toArray(),
            ]);
        } catch (\Throwable $e) {
            $this->auth->logAction('search_items', 'item', null, 'error', [
                'error' => $e->getMessage(),
            ]);

            return ToolResult::error("Failed to search items: {$e->getMessage()}");
        }
    }
}

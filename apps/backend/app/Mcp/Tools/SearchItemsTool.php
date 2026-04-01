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
use Laravel\Mcp\Server\Tools\Annotations\IsReadOnly;

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

    public function schema(JsonSchema $schema): array
    {
        return [
            'search' => $schema->string()
                ->description('Text to search for in item titles and descriptions.'),
            'scope' => $schema->string()
                ->enum(['active', 'planned', 'all'])
                ->description('Filter by scope: active, planned, or all.'),
            'status' => $schema->array()
                ->items($schema->string()->enum(['todo', 'doing', 'done', 'wontdo']))
                ->description('Filter by one or more statuses. Backwards-compatible callers may still pass a single string.'),
            'project_id' => $schema->string()
                ->description('Filter by project UUID, or use inbox for items with no project.'),
            'tag_id' => $schema->string()
                ->description('Filter by tag UUID.'),
            'assigned_to_me' => $schema->boolean()
                ->description('If true, only show items assigned to you by other users.'),
            'delegated' => $schema->boolean()
                ->description('If true, only show items you own but have assigned to other users.'),
            'scheduled_from' => $schema->string()
                ->description('Filter items scheduled on or after this date in ISO 8601 format YYYY-MM-DD.'),
            'scheduled_to' => $schema->string()
                ->description('Filter items scheduled on or before this date in ISO 8601 format YYYY-MM-DD.'),
            'due_from' => $schema->string()
                ->description('Filter items due on or after this date in ISO 8601 format YYYY-MM-DD.'),
            'due_to' => $schema->string()
                ->description('Filter items due on or before this date in ISO 8601 format YYYY-MM-DD.'),
            'limit' => $schema->integer()
                ->description('Maximum number of items to return.'),
        ];
    }

    public function handle(Request $request): Response|Generator
    {
        try {
            $arguments = $request->all();
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
                        return Response::error("Invalid {$field} format. Use ISO 8601 format: YYYY-MM-DD");
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

            return Response::json([
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

            return Response::error("Failed to search items: {$e->getMessage()}");
        }
    }
}

<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use App\Mcp\Services\McpAuthContext;
use App\Models\Item;
use Generator;
use Illuminate\Support\Facades\DB;
use Laravel\Mcp\Server\Tool;
use Laravel\Mcp\Server\Tools\Annotations\IsIdempotent;
use Laravel\Mcp\Server\Tools\ToolInputSchema;
use Laravel\Mcp\Server\Tools\ToolResult;

/**
 * Create a new todo item.
 */
#[IsIdempotent]
final class CreateItemTool extends Tool
{
    public function __construct(
        private readonly McpAuthContext $auth
    ) {}

    public function name(): string
    {
        return 'create_item';
    }

    public function description(): string
    {
        return 'Create a new todo item. Items can be organised into projects, tagged, scheduled for future dates, and have due dates set.';
    }

    public function schema(ToolInputSchema $schema): ToolInputSchema
    {
        return $schema
            ->string('title')
            ->description('The title of the todo item (required)')
            ->required()
            ->string('description')
            ->description('Detailed description of the task')
            ->string('project_id')
            ->description('UUID of the project to assign this item to (optional, null for inbox)')
            ->raw('status', [
                'type' => 'string',
                'enum' => ['todo', 'doing', 'done', 'wontdo'],
                'description' => 'Initial status of the item (default: todo)',
            ])
            ->string('scheduled_date')
            ->description('Date to schedule the item for (ISO 8601 format: YYYY-MM-DD). Future dates hide the item until that date.')
            ->string('due_date')
            ->description('Due date for the item (ISO 8601 format: YYYY-MM-DD)')
            ->string('recurrence_rule')
            ->description('RRULE string for recurring items (RFC 5545 subset, e.g., FREQ=DAILY;INTERVAL=1)')
            ->raw('recurrence_strategy', [
                'type' => 'string',
                'enum' => ['expires', 'carry_over'],
                'description' => 'How to handle missed recurrences: expires (mark as wontdo) or carry_over (keep active)',
            ])
            ->raw('tag_ids', [
                'type' => 'array',
                'items' => ['type' => 'string'],
                'description' => 'Array of tag UUIDs to attach to this item',
            ])
            ->integer('position')
            ->description('Position for ordering (0 = top, higher numbers = lower in list)');
    }

    public function handle(array $arguments): ToolResult|Generator
    {
        try {
            $user = $this->auth->user();

            // Validate project ownership if provided
            if (! empty($arguments['project_id'])) {
                $project = $this->auth->getProject($arguments['project_id']);
                if ($project === null) {
                    return ToolResult::error("Project not found or access denied: {$arguments['project_id']}");
                }
            }

            // Validate tag ownership if provided
            $tagIds = $arguments['tag_ids'] ?? [];
            if (! empty($tagIds)) {
                foreach ($tagIds as $tagId) {
                    $tag = $this->auth->getTag($tagId);
                    if ($tag === null) {
                        return ToolResult::error("Tag not found or access denied: {$tagId}");
                    }
                }
            }

            // Validate dates
            $scheduledDate = null;
            $dueDate = null;

            if (! empty($arguments['scheduled_date'])) {
                try {
                    $scheduledDate = new \DateTimeImmutable($arguments['scheduled_date']);
                } catch (\Exception) {
                    return ToolResult::error('Invalid scheduled_date format. Use ISO 8601 format: YYYY-MM-DD');
                }
            }

            if (! empty($arguments['due_date'])) {
                try {
                    $dueDate = new \DateTimeImmutable($arguments['due_date']);
                } catch (\Exception) {
                    return ToolResult::error('Invalid due_date format. Use ISO 8601 format: YYYY-MM-DD');
                }
            }

            // Validate due_date >= scheduled_date
            if ($scheduledDate && $dueDate && $dueDate < $scheduledDate) {
                return ToolResult::error('due_date must be on or after scheduled_date');
            }

            // Create item and attach tags within a transaction
            $item = DB::transaction(function () use ($user, $arguments, $scheduledDate, $dueDate, $tagIds) {
                $item = Item::create([
                    'user_id' => $user->id,
                    'title' => $arguments['title'],
                    'description' => $arguments['description'] ?? null,
                    'project_id' => $arguments['project_id'] ?? null,
                    'status' => $arguments['status'] ?? 'todo',
                    'scheduled_date' => $scheduledDate?->format('Y-m-d'),
                    'due_date' => $dueDate?->format('Y-m-d'),
                    'recurrence_rule' => $arguments['recurrence_rule'] ?? null,
                    'recurrence_strategy' => $arguments['recurrence_strategy'] ?? null,
                    'position' => $arguments['position'] ?? 0,
                ]);

                // Attach tags
                if (! empty($tagIds)) {
                    $item->tags()->attach($tagIds);
                }

                return $item;
            });

            // Load relationships for response
            $item->load(['project', 'tags']);

            // Log the action
            $this->auth->logAction('create_item', 'item', (string) $item->id, 'success', [
                'title' => $item->title,
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
                    'scheduled_date' => $item->scheduled_date?->format('Y-m-d'),
                    'due_date' => $item->due_date?->format('Y-m-d'),
                    'recurrence_rule' => $item->recurrence_rule,
                    'position' => $item->position,
                    'tags' => $item->tags->map(fn ($tag) => [
                        'id' => $tag->id,
                        'name' => $tag->name,
                    ])->toArray(),
                    'created_at' => $item->created_at->toIso8601String(),
                ],
            ]);
        } catch (\Throwable $e) {
            $this->auth->logAction('create_item', 'item', null, 'error', [
                'error' => $e->getMessage(),
            ]);

            return ToolResult::error("Failed to create item: {$e->getMessage()}");
        }
    }
}

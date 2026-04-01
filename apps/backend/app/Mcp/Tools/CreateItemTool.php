<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use App\Mcp\Services\McpAuthContext;
use App\Models\Item;
use Generator;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Support\Facades\DB;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Tool;
use Laravel\Mcp\Server\Tools\Annotations\IsIdempotent;

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

    public function schema(JsonSchema $schema): array
    {
        return [
            'title' => $schema->string()
                ->description('The title of the todo item.')
                ->required(),
            'description' => $schema->string()
                ->description('Detailed description of the task.'),
            'project_id' => $schema->string()
                ->description('UUID of the project to assign this item to, or null for inbox items.')
                ->nullable(),
            'status' => $schema->string()
                ->enum(['todo', 'doing', 'done', 'wontdo'])
                ->description('Initial status of the item.'),
            'scheduled_date' => $schema->string()
                ->description('Date to schedule the item for in ISO 8601 format YYYY-MM-DD.'),
            'due_date' => $schema->string()
                ->description('Due date for the item in ISO 8601 format YYYY-MM-DD.'),
            'recurrence_rule' => $schema->string()
                ->description('RRULE string for recurring items, for example FREQ=DAILY;INTERVAL=1.'),
            'recurrence_strategy' => $schema->string()
                ->enum(['expires', 'carry_over'])
                ->description('How to handle missed recurrences: expires marks them as wontdo, carry_over keeps them active.'),
            'tag_ids' => $schema->array()
                ->items($schema->string())
                ->description('Array of tag UUIDs to attach to this item.'),
            'position' => $schema->integer()
                ->description('Position for ordering, where 0 is top and higher numbers are lower in the list.'),
        ];
    }

    public function handle(Request $request): Response|Generator
    {
        try {
            $arguments = $request->all();
            $user = $this->auth->user();

            // Validate project ownership if provided
            if (! empty($arguments['project_id'])) {
                $project = $this->auth->getProject($arguments['project_id']);
                if ($project === null) {
                    return Response::error("Project not found or access denied: {$arguments['project_id']}");
                }
            }

            // Validate tag ownership if provided
            $tagIds = $arguments['tag_ids'] ?? [];
            if (! empty($tagIds)) {
                foreach ($tagIds as $tagId) {
                    $tag = $this->auth->getTag($tagId);
                    if ($tag === null) {
                        return Response::error("Tag not found or access denied: {$tagId}");
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
                    return Response::error('Invalid scheduled_date format. Use ISO 8601 format: YYYY-MM-DD');
                }
            }

            if (! empty($arguments['due_date'])) {
                try {
                    $dueDate = new \DateTimeImmutable($arguments['due_date']);
                } catch (\Exception) {
                    return Response::error('Invalid due_date format. Use ISO 8601 format: YYYY-MM-DD');
                }
            }

            // Validate due_date >= scheduled_date
            if ($scheduledDate && $dueDate && $dueDate < $scheduledDate) {
                return Response::error('due_date must be on or after scheduled_date');
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

            return Response::json([
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

            return Response::error("Failed to create item: {$e->getMessage()}");
        }
    }
}

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
 * Look up connected users for task assignment.
 */
#[IsReadOnly]
#[IsIdempotent]
final class LookupUsersTool extends Tool
{
    public function __construct(
        private readonly McpAuthContext $auth
    ) {}

    public function name(): string
    {
        return 'lookup_users';
    }

    public function description(): string
    {
        return 'Look up users you are connected with for task assignment. Only connected users (mutual consent) can be assigned tasks. Use this before assign_item to find valid assignees.';
    }

    public function schema(ToolInputSchema $schema): ToolInputSchema
    {
        return $schema
            ->string('search')
            ->description('Optional search text to filter by name or email');
    }

    public function handle(array $arguments): ToolResult|Generator
    {
        try {
            $connectedUsers = $this->auth->getConnectedUsers();

            // Filter by search if provided
            if (isset($arguments['search']) && $arguments['search'] !== '') {
                $search = strtolower($arguments['search']);
                $connectedUsers = $connectedUsers->filter(function ($user) use ($search) {
                    return str_contains(strtolower($user->name), $search) ||
                           str_contains(strtolower($user->email), $search);
                });
            }

            // Get favourites for highlighting
            $favouriteIds = $this->auth->user()->favourites()->pluck('favourite_id')->toArray();

            // Log the action
            $this->auth->logAction('lookup_users', 'user', null, 'success', [
                'result_count' => $connectedUsers->count(),
            ]);

            return ToolResult::json([
                'success' => true,
                'count' => $connectedUsers->count(),
                'users' => $connectedUsers->map(fn ($user) => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'is_favourite' => in_array($user->id, $favouriteIds, true),
                ])->values()->toArray(),
            ]);
        } catch (\Throwable $e) {
            $this->auth->logAction('lookup_users', 'user', null, 'error', [
                'error' => $e->getMessage(),
            ]);

            return ToolResult::error("Failed to lookup users: {$e->getMessage()}");
        }
    }
}

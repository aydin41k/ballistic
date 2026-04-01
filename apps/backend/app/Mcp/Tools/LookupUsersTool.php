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

    public function schema(JsonSchema $schema): array
    {
        return [
            'search' => $schema->string()
                ->description('Optional search text to filter connected users by name or email.'),
        ];
    }

    public function handle(Request $request): Response|Generator
    {
        try {
            $arguments = $request->all();
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

            return Response::json([
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

            return Response::error("Failed to lookup users: {$e->getMessage()}");
        }
    }
}

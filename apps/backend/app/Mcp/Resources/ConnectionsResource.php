<?php

declare(strict_types=1);

namespace App\Mcp\Resources;

use App\Mcp\Services\McpAuthContext;
use Laravel\Mcp\Server\Resource;

/**
 * MCP Resource for listing connected users.
 */
final class ConnectionsResource extends Resource
{
    protected string $description = 'List of users connected with the authenticated user. These are valid assignees for task delegation.';

    public function __construct(
        private readonly McpAuthContext $auth
    ) {}

    public function name(): string
    {
        return 'connections-list';
    }

    public function title(): string
    {
        return 'Connected Users';
    }

    public function uri(): string
    {
        return 'ballistic://connections';
    }

    public function mimeType(): string
    {
        return 'application/json';
    }

    public function read(): string
    {
        $connections = $this->auth->getConnectedUsers();
        $favouriteIds = $this->auth->user()->favourites()->pluck('favourite_id')->toArray();

        $data = [
            'count' => $connections->count(),
            'connections' => $connections->map(fn ($user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'is_favourite' => in_array($user->id, $favouriteIds, true),
            ])->toArray(),
        ];

        return json_encode($data, JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR);
    }
}

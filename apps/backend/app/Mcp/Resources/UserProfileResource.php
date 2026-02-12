<?php

declare(strict_types=1);

namespace App\Mcp\Resources;

use App\Mcp\Services\McpAuthContext;
use Laravel\Mcp\Server\Resource;

/**
 * MCP Resource for the authenticated user's profile.
 */
final class UserProfileResource extends Resource
{
    protected string $description = 'The authenticated user\'s profile information including counts of items, projects, and tags.';

    public function __construct(
        private readonly McpAuthContext $auth
    ) {}

    public function name(): string
    {
        return 'user-profile';
    }

    public function title(): string
    {
        return 'User Profile';
    }

    public function uri(): string
    {
        return 'ballistic://users/me';
    }

    public function mimeType(): string
    {
        return 'application/json';
    }

    public function read(): string
    {
        $user = $this->auth->user();

        $data = [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'notes' => $user->notes,
            'feature_flags' => $user->feature_flags ?? [],
            'email_verified_at' => $user->email_verified_at?->toIso8601String(),
            'created_at' => $user->created_at->toIso8601String(),
            'counts' => [
                'items' => $user->items()->count(),
                'assigned_items' => $user->assignedItems()->count(),
                'projects' => $user->projects()->whereNull('archived_at')->count(),
                'tags' => $user->tags()->count(),
                'connections' => $user->connections()->count(),
                'unread_notifications' => $user->unreadNotifications()->count(),
            ],
        ];

        return json_encode($data, JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR);
    }
}

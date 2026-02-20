<?php

declare(strict_types=1);

namespace App\Mcp\Resources;

use App\Mcp\Services\McpAuthContext;
use Laravel\Mcp\Server\Resource;

/**
 * MCP Resource for listing all tags.
 */
final class TagsResource extends Resource
{
    protected string $description = 'List of all tags owned by the authenticated user with usage counts.';

    public function __construct(
        private readonly McpAuthContext $auth
    ) {}

    public function name(): string
    {
        return 'tags-list';
    }

    public function title(): string
    {
        return 'Tags';
    }

    public function uri(): string
    {
        return 'ballistic://tags';
    }

    public function mimeType(): string
    {
        return 'application/json';
    }

    public function read(): string
    {
        $tags = $this->auth->getTags();

        $data = [
            'count' => $tags->count(),
            'tags' => $tags->map(fn ($tag) => [
                'id' => $tag->id,
                'name' => $tag->name,
                'color' => $tag->color,
                'items_count' => $tag->items()->count(),
                'active_items_count' => $tag->items()->whereIn('status', ['todo', 'doing'])->count(),
                'created_at' => $tag->created_at->toIso8601String(),
            ])->toArray(),
        ];

        return json_encode($data, JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR);
    }
}

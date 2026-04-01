<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use App\Mcp\Services\McpAuthContext;
use App\Models\Tag;
use Generator;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Support\Facades\DB;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Tool;
use Laravel\Mcp\Server\Tools\Annotations\IsIdempotent;

/**
 * Create a new tag.
 */
#[IsIdempotent]
final class CreateTagTool extends Tool
{
    public function __construct(
        private readonly McpAuthContext $auth
    ) {}

    public function name(): string
    {
        return 'create_tag';
    }

    public function description(): string
    {
        return 'Create a new tag for categorising todo items.';
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'name' => $schema->string()
                ->description('The name of the tag. It must be unique per user.')
                ->required(),
            'color' => $schema->string()
                ->description('Hex colour code for the tag, for example #FF5733.'),
        ];
    }

    public function handle(Request $request): Response|Generator
    {
        try {
            $arguments = $request->all();
            $user = $this->auth->user();

            // Validate colour format if provided
            if (isset($arguments['color']) && ! preg_match('/^#[0-9A-Fa-f]{6}$/', $arguments['color'])) {
                return Response::error('Invalid colour format. Use hex format: #RRGGBB');
            }

            // Use firstOrCreate within a transaction to prevent race conditions
            $wasRecentlyCreated = false;
            $tag = DB::transaction(function () use ($user, $arguments, &$wasRecentlyCreated) {
                $tag = Tag::firstOrCreate(
                    [
                        'user_id' => $user->id,
                        'name' => $arguments['name'],
                    ],
                    [
                        'color' => $arguments['color'] ?? null,
                    ]
                );
                $wasRecentlyCreated = $tag->wasRecentlyCreated;

                return $tag;
            });

            if (! $wasRecentlyCreated) {
                return Response::json([
                    'success' => true,
                    'message' => 'Tag already exists with this name',
                    'tag' => [
                        'id' => $tag->id,
                        'name' => $tag->name,
                        'color' => $tag->color,
                    ],
                ]);
            }

            // Log the action
            $this->auth->logAction('create_tag', 'tag', (string) $tag->id, 'success', [
                'name' => $tag->name,
            ]);

            return Response::json([
                'success' => true,
                'tag' => [
                    'id' => $tag->id,
                    'name' => $tag->name,
                    'color' => $tag->color,
                    'created_at' => $tag->created_at->toIso8601String(),
                ],
            ]);
        } catch (\Throwable $e) {
            $this->auth->logAction('create_tag', 'tag', null, 'error', [
                'error' => $e->getMessage(),
            ]);

            return Response::error("Failed to create tag: {$e->getMessage()}");
        }
    }
}

<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use App\Mcp\Services\McpAuthContext;
use Generator;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Tool;
use Laravel\Mcp\Server\Tools\Annotations\IsDestructive;

/**
 * Delete a todo item.
 */
#[IsDestructive]
final class DeleteItemTool extends Tool
{
    public function __construct(
        private readonly McpAuthContext $auth
    ) {}

    public function name(): string
    {
        return 'delete_item';
    }

    public function description(): string
    {
        return 'Delete a todo item. Only the owner can delete items. Items are soft-deleted and can potentially be recovered.';
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'id' => $schema->string()
                ->description('The UUID of the item to delete.')
                ->required(),
        ];
    }

    public function handle(Request $request): Response|Generator
    {
        try {
            $arguments = $request->all();
            // Get the item
            $item = $this->auth->getItem($arguments['id']);

            if ($item === null) {
                return Response::error("Item not found or access denied: {$arguments['id']}");
            }

            // Check delete permission (owner only)
            if (! $this->auth->canDeleteItem($item)) {
                return Response::error('Only the item owner can delete items');
            }

            $title = $item->title;

            // Soft delete the item
            $item->delete();

            // Log the action
            $this->auth->logAction('delete_item', 'item', $arguments['id'], 'success', [
                'title' => $title,
            ]);

            return Response::json([
                'success' => true,
                'message' => "Item '{$title}' has been deleted",
                'deleted_id' => $arguments['id'],
            ]);
        } catch (\Throwable $e) {
            $this->auth->logAction('delete_item', 'item', $arguments['id'] ?? null, 'error', [
                'error' => $e->getMessage(),
            ]);

            return Response::error("Failed to delete item: {$e->getMessage()}");
        }
    }
}

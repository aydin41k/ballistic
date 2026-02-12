<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use App\Contracts\NotificationServiceInterface;
use App\Mcp\Services\McpAuthContext;
use Generator;
use Illuminate\Support\Facades\DB;
use Laravel\Mcp\Server\Tool;
use Laravel\Mcp\Server\Tools\Annotations\IsIdempotent;
use Laravel\Mcp\Server\Tools\ToolInputSchema;
use Laravel\Mcp\Server\Tools\ToolResult;

/**
 * Assign a todo item to another user.
 */
#[IsIdempotent]
final class AssignItemTool extends Tool
{
    public function __construct(
        private readonly McpAuthContext $auth,
        private readonly NotificationServiceInterface $notifications
    ) {}

    public function name(): string
    {
        return 'assign_item';
    }

    public function description(): string
    {
        return 'Assign a todo item to a connected user. You can only assign items you own, and only to users you have an accepted connection with. Use lookup_users to find valid assignees.';
    }

    public function schema(ToolInputSchema $schema): ToolInputSchema
    {
        return $schema
            ->string('item_id')
            ->description('The UUID of the item to assign (required)')
            ->required()
            ->string('assignee_id')
            ->description('The UUID of the user to assign the item to, or null to unassign (required)')
            ->required()
            ->string('description')
            ->description('Optional description to update when assigning (useful for providing context to the assignee)');
    }

    public function handle(array $arguments): ToolResult|Generator
    {
        try {
            // Get the item
            $item = $this->auth->getItem($arguments['item_id']);

            if ($item === null) {
                return ToolResult::error("Item not found or access denied: {$arguments['item_id']}");
            }

            // Check if user is the owner (only owners can assign)
            if (! $this->auth->isItemOwner($item)) {
                return ToolResult::error('Only the item owner can assign items to others');
            }

            $assigneeId = $arguments['assignee_id'];

            // Handle unassignment
            if ($assigneeId === null || $assigneeId === '') {
                $previousAssignee = $item->assignee;
                $ownerName = $item->user->name;

                DB::transaction(function () use ($item): void {
                    $item->update(['assignee_id' => null]);
                });

                if ($previousAssignee) {
                    $this->notifications->notifyTaskUnassigned(
                        $previousAssignee,
                        (string) $item->id,
                        $item->title,
                        $ownerName
                    );
                }

                $this->auth->logAction('unassign_item', 'item', (string) $item->id, 'success', [
                    'previous_assignee_id' => $previousAssignee ? (string) $previousAssignee->id : null,
                ]);

                return ToolResult::json([
                    'success' => true,
                    'message' => 'Item has been unassigned',
                    'item' => [
                        'id' => $item->id,
                        'title' => $item->title,
                        'assignee_id' => null,
                    ],
                ]);
            }

            // Validate connection exists
            if (! $this->auth->canAssignTo($assigneeId)) {
                return ToolResult::error("Cannot assign to user '{$assigneeId}': No accepted connection exists. Use lookup_users to find valid assignees.");
            }

            // Prepare update data
            $updateData = ['assignee_id' => $assigneeId];

            // Update description if provided
            if (isset($arguments['description'])) {
                $updateData['description'] = $arguments['description'];
            }

            // Store previous assignee for notification
            $previousAssignee = $item->assignee;

            // Update the item within a transaction
            DB::transaction(function () use ($item, $updateData): void {
                $item->update($updateData);
            });
            $item->load('assignee');

            // Load owner relationship
            $item->load('user');

            // Send notification to new assignee
            $this->notifications->notifyTaskAssignment(
                $item->assignee,
                (string) $item->id,
                $item->title,
                $item->user->name
            );

            // Notify previous assignee if task was reassigned
            if ($previousAssignee && (string) $previousAssignee->id !== (string) $assigneeId) {
                $this->notifications->notifyTaskUnassigned(
                    $previousAssignee,
                    (string) $item->id,
                    $item->title,
                    $item->user->name
                );
            }

            // Log the action
            $this->auth->logAction('assign_item', 'item', (string) $item->id, 'success', [
                'assignee_id' => $assigneeId,
                'assignee_name' => $item->assignee->name,
            ]);

            return ToolResult::json([
                'success' => true,
                'message' => "Item assigned to {$item->assignee->name}",
                'item' => [
                    'id' => $item->id,
                    'title' => $item->title,
                    'description' => $item->description,
                    'assignee_id' => $item->assignee_id,
                    'assignee_name' => $item->assignee->name,
                    'assignee_email' => $item->assignee->email,
                ],
            ]);
        } catch (\Throwable $e) {
            $this->auth->logAction('assign_item', 'item', $arguments['item_id'] ?? null, 'error', [
                'error' => $e->getMessage(),
            ]);

            return ToolResult::error("Failed to assign item: {$e->getMessage()}");
        }
    }
}

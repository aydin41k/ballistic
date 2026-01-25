<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Notification;
use App\Models\User;

final class NotificationService
{
    /**
     * Create a notification for a task assignment.
     */
    public function notifyTaskAssignment(
        User $assignee,
        string $taskId,
        string $taskTitle,
        string $assignerName
    ): Notification {
        return Notification::create([
            'user_id' => $assignee->id,
            'type' => 'task_assigned',
            'title' => 'New Task Assigned',
            'message' => "{$assignerName} assigned you a task: {$taskTitle}",
            'data' => [
                'item_id' => $taskId,
                'assigner_name' => $assignerName,
            ],
        ]);
    }

    /**
     * Create a notification when a task is unassigned from a user.
     */
    public function notifyTaskUnassigned(
        User $previousAssignee,
        string $taskId,
        string $taskTitle,
        string $ownerName
    ): Notification {
        return Notification::create([
            'user_id' => $previousAssignee->id,
            'type' => 'task_unassigned',
            'title' => 'Task Unassigned',
            'message' => "{$ownerName} removed your assignment from: {$taskTitle}",
            'data' => [
                'item_id' => $taskId,
                'owner_name' => $ownerName,
            ],
        ]);
    }

    /**
     * Create a notification when a task is updated by the owner.
     */
    public function notifyTaskUpdated(
        User $assignee,
        string $taskId,
        string $taskTitle,
        string $ownerName,
        array $changes = []
    ): Notification {
        return Notification::create([
            'user_id' => $assignee->id,
            'type' => 'task_updated',
            'title' => 'Task Updated',
            'message' => "{$ownerName} updated the task: {$taskTitle}",
            'data' => [
                'item_id' => $taskId,
                'owner_name' => $ownerName,
                'changes' => $changes,
            ],
        ]);
    }

    /**
     * Create a notification when a task is completed by the owner.
     */
    public function notifyTaskCompleted(
        User $assignee,
        string $taskId,
        string $taskTitle,
        string $ownerName,
        string $newStatus
    ): Notification {
        $statusLabel = $newStatus === 'done' ? 'completed' : 'marked as won\'t do';

        return Notification::create([
            'user_id' => $assignee->id,
            'type' => 'task_completed',
            'title' => 'Task Completed',
            'message' => "{$ownerName} {$statusLabel}: {$taskTitle}",
            'data' => [
                'item_id' => $taskId,
                'owner_name' => $ownerName,
                'new_status' => $newStatus,
            ],
        ]);
    }

    /**
     * Create a notification for a connection request.
     */
    public function notifyConnectionRequest(
        User $addressee,
        string $requesterName
    ): Notification {
        return Notification::create([
            'user_id' => $addressee->id,
            'type' => 'connection_request',
            'title' => 'Connection Request',
            'message' => "{$requesterName} wants to connect with you",
            'data' => [
                'requester_name' => $requesterName,
            ],
        ]);
    }

    /**
     * Create a notification when a connection request is accepted.
     */
    public function notifyConnectionAccepted(
        User $requester,
        string $addresseeName
    ): Notification {
        return Notification::create([
            'user_id' => $requester->id,
            'type' => 'connection_accepted',
            'title' => 'Connection Accepted',
            'message' => "{$addresseeName} accepted your connection request",
            'data' => [
                'addressee_name' => $addresseeName,
            ],
        ]);
    }

    /**
     * Get unread notification count for a user.
     */
    public function getUnreadCount(User $user): int
    {
        return $user->unreadNotifications()->count();
    }

    /**
     * Mark all notifications as read for a user.
     * Returns the count of notifications that were marked as read.
     */
    public function markAsRead(User $user): int
    {
        return $user->unreadNotifications()
            ->update(['read_at' => now()]);
    }
}

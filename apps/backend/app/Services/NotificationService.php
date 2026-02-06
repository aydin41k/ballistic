<?php

declare(strict_types=1);

namespace App\Services;

use App\Contracts\NotificationServiceInterface;
use App\Jobs\CreateNotificationJob;
use App\Models\User;

final class NotificationService implements NotificationServiceInterface
{
    /**
     * Dispatch a notification for a task assignment.
     */
    public function notifyTaskAssignment(
        User $assignee,
        string $taskId,
        string $taskTitle,
        string $assignerName
    ): void {
        CreateNotificationJob::dispatch(
            userId: (string) $assignee->id,
            type: 'task_assigned',
            title: 'New Task Assigned',
            message: "{$assignerName} assigned you a task: {$taskTitle}",
            data: [
                'item_id' => $taskId,
                'assigner_name' => $assignerName,
            ],
        );
    }

    /**
     * Dispatch a notification when a task is unassigned from a user.
     */
    public function notifyTaskUnassigned(
        User $previousAssignee,
        string $taskId,
        string $taskTitle,
        string $ownerName
    ): void {
        CreateNotificationJob::dispatch(
            userId: (string) $previousAssignee->id,
            type: 'task_unassigned',
            title: 'Task Unassigned',
            message: "{$ownerName} removed your assignment from: {$taskTitle}",
            data: [
                'item_id' => $taskId,
                'owner_name' => $ownerName,
            ],
        );
    }

    /**
     * Dispatch a notification when a task is updated by the owner.
     *
     * @param  array<string, mixed>  $changes
     */
    public function notifyTaskUpdated(
        User $assignee,
        string $taskId,
        string $taskTitle,
        string $ownerName,
        array $changes = []
    ): void {
        CreateNotificationJob::dispatch(
            userId: (string) $assignee->id,
            type: 'task_updated',
            title: 'Task Updated',
            message: "{$ownerName} updated the task: {$taskTitle}",
            data: [
                'item_id' => $taskId,
                'owner_name' => $ownerName,
                'changes' => $changes,
            ],
        );
    }

    /**
     * Dispatch a notification when a task is completed by the owner.
     */
    public function notifyTaskCompleted(
        User $assignee,
        string $taskId,
        string $taskTitle,
        string $ownerName,
        string $newStatus
    ): void {
        $statusLabel = $newStatus === 'done' ? 'completed' : 'marked as won\'t do';

        CreateNotificationJob::dispatch(
            userId: (string) $assignee->id,
            type: 'task_completed',
            title: 'Task Completed',
            message: "{$ownerName} {$statusLabel}: {$taskTitle}",
            data: [
                'item_id' => $taskId,
                'owner_name' => $ownerName,
                'new_status' => $newStatus,
            ],
        );
    }

    /**
     * Dispatch a notification when a task is completed by the assignee.
     */
    public function notifyTaskCompletedByAssignee(
        User $owner,
        string $taskId,
        string $taskTitle,
        string $assigneeName,
        string $newStatus
    ): void {
        $statusLabel = $newStatus === 'done' ? 'completed' : 'marked as won\'t do';

        CreateNotificationJob::dispatch(
            userId: (string) $owner->id,
            type: 'task_completed_by_assignee',
            title: 'Task Completed by Assignee',
            message: "{$assigneeName} {$statusLabel}: {$taskTitle}",
            data: [
                'item_id' => $taskId,
                'assignee_name' => $assigneeName,
                'new_status' => $newStatus,
            ],
        );
    }

    /**
     * Dispatch a notification when an assignee rejects (unassigns themselves from) a task.
     */
    public function notifyTaskRejected(
        User $owner,
        string $taskId,
        string $taskTitle,
        string $assigneeName
    ): void {
        CreateNotificationJob::dispatch(
            userId: (string) $owner->id,
            type: 'task_rejected',
            title: 'Task Rejected',
            message: "{$assigneeName} declined the task: {$taskTitle}",
            data: [
                'item_id' => $taskId,
                'assignee_name' => $assigneeName,
            ],
        );
    }

    /**
     * Dispatch a notification for a connection request.
     */
    public function notifyConnectionRequest(
        User $addressee,
        string $requesterName
    ): void {
        CreateNotificationJob::dispatch(
            userId: (string) $addressee->id,
            type: 'connection_request',
            title: 'Connection Request',
            message: "{$requesterName} wants to connect with you",
            data: [
                'requester_name' => $requesterName,
            ],
        );
    }

    /**
     * Dispatch a notification when a connection request is accepted.
     */
    public function notifyConnectionAccepted(
        User $requester,
        string $addresseeName
    ): void {
        CreateNotificationJob::dispatch(
            userId: (string) $requester->id,
            type: 'connection_accepted',
            title: 'Connection Accepted',
            message: "{$addresseeName} accepted your connection request",
            data: [
                'addressee_name' => $addresseeName,
            ],
        );
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

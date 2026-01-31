<?php

declare(strict_types=1);

namespace App\Contracts;

use App\Models\User;

interface NotificationServiceInterface
{
    /**
     * Dispatch a notification for a task assignment.
     */
    public function notifyTaskAssignment(
        User $assignee,
        string $taskId,
        string $taskTitle,
        string $assignerName
    ): void;

    /**
     * Dispatch a notification when a task is unassigned from a user.
     */
    public function notifyTaskUnassigned(
        User $previousAssignee,
        string $taskId,
        string $taskTitle,
        string $ownerName
    ): void;

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
    ): void;

    /**
     * Dispatch a notification when a task is completed by the owner.
     */
    public function notifyTaskCompleted(
        User $assignee,
        string $taskId,
        string $taskTitle,
        string $ownerName,
        string $newStatus
    ): void;

    /**
     * Dispatch a notification for a connection request.
     */
    public function notifyConnectionRequest(
        User $addressee,
        string $requesterName
    ): void;

    /**
     * Dispatch a notification when a connection request is accepted.
     */
    public function notifyConnectionAccepted(
        User $requester,
        string $addresseeName
    ): void;

    /**
     * Get unread notification count for a user.
     */
    public function getUnreadCount(User $user): int;

    /**
     * Mark all notifications as read for a user.
     * Returns the count of notifications that were marked as read.
     */
    public function markAsRead(User $user): int;
}

<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;

final class AdminUserService
{
    public function __construct(
        private readonly AuditLogService $auditLogService,
    ) {}

    /**
     * Hard reset: wipe all data owned by or assigned to the user, keep the account.
     *
     * The target row is locked for update at the start of the transaction so
     * that concurrent hard-resets on the same user queue behind each other
     * rather than racing and producing duplicate audit entries.
     *
     * All relationship counts are fetched in a single loadCount() query
     * (one correlated subquery per relationship) instead of six separate
     * COUNT(*) round-trips.
     */
    public function hardReset(User $admin, User $target, string $ipAddress, string $userAgent): void
    {
        DB::transaction(function () use ($admin, $target, $ipAddress, $userAgent): void {
            // Re-fetch with an exclusive row lock so concurrent resets on the
            // same user serialise rather than interleave their reads and deletes.
            $target = User::lockForUpdate()->findOrFail($target->getKey());

            // Single query: one SELECT with six correlated COUNT subqueries.
            $target->loadCount([
                'items',
                'projects',
                'tags',
                'taskNotifications',
                'sentConnectionRequests',
                'receivedConnectionRequests',
            ]);

            $oldValues = [
                'items_count' => $target->items_count,
                'projects_count' => $target->projects_count,
                'tags_count' => $target->tags_count,
                'notifications_count' => $target->task_notifications_count,
                'connections_count' => $target->sent_connection_requests_count + $target->received_connection_requests_count,
            ];

            // Wipe items (force delete to bypass soft deletes)
            $target->items()->forceDelete();

            // Wipe assigned items references (nullify assignee)
            $target->assignedItems()->update(['assignee_id' => null]);

            // Wipe projects (cascades to items via FK or we handle it via forceDelete above)
            $target->projects()->forceDelete();

            // Wipe tags
            $target->tags()->delete();

            // Wipe notifications
            $target->taskNotifications()->delete();

            // Wipe connections (both directions)
            $target->sentConnectionRequests()->delete();
            $target->receivedConnectionRequests()->delete();

            // Wipe push subscriptions
            $target->pushSubscriptions()->delete();

            // Revoke all Sanctum tokens
            $target->tokens()->delete();

            $this->auditLogService->log(
                admin: $admin,
                action: 'user.hard_reset',
                subjectType: 'user',
                subjectId: (string) $target->getKey(),
                oldValues: $oldValues,
                ipAddress: $ipAddress,
                userAgent: $userAgent,
            );
        });
    }

    /**
     * Toggle the admin role for a user.
     *
     * Wrapped in a transaction with a row lock so that two concurrent
     * role-toggles on the same user cannot both read the same old value
     * and produce conflicting audit entries.
     */
    public function toggleAdminRole(User $admin, User $target, bool $makeAdmin, string $ipAddress, string $userAgent): void
    {
        DB::transaction(function () use ($admin, $target, $makeAdmin, $ipAddress, $userAgent): void {
            $target = User::lockForUpdate()->findOrFail($target->getKey());

            $oldValues = ['is_admin' => $target->is_admin];
            $target->update(['is_admin' => $makeAdmin]);

            $this->auditLogService->log(
                admin: $admin,
                action: 'user.role_changed',
                subjectType: 'user',
                subjectId: (string) $target->getKey(),
                oldValues: $oldValues,
                newValues: ['is_admin' => $makeAdmin],
                ipAddress: $ipAddress,
                userAgent: $userAgent,
            );
        });
    }

    /**
     * Update user profile fields (name, email, phone, notes).
     *
     * Wrapped in a transaction with a row lock so the old-value snapshot
     * and the write are always consistent.
     *
     * @param  array<string, mixed>  $data
     */
    public function updateProfile(User $admin, User $target, array $data, string $ipAddress, string $userAgent): void
    {
        DB::transaction(function () use ($admin, $target, $data, $ipAddress, $userAgent): void {
            $target = User::lockForUpdate()->findOrFail($target->getKey());

            $oldValues = $target->only(array_keys($data));
            $target->update($data);

            $this->auditLogService->log(
                admin: $admin,
                action: 'user.profile_updated',
                subjectType: 'user',
                subjectId: (string) $target->getKey(),
                oldValues: $oldValues,
                newValues: $data,
                ipAddress: $ipAddress,
                userAgent: $userAgent,
            );
        });
    }
}

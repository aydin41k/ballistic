<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\AuditLog;
use App\Models\User;

final class AuditLogService
{
    /**
     * Record an admin action in the audit log.
     *
     * ip_address and user_agent are written in the same INSERT so there is
     * never a window where the record exists without them.
     */
    public function log(
        User $admin,
        string $action,
        string $subjectType,
        string $subjectId,
        ?array $oldValues = null,
        ?array $newValues = null,
        string $ipAddress = '',
        string $userAgent = '',
    ): AuditLog {
        return AuditLog::create([
            'admin_id' => (string) $admin->getKey(),
            'action' => $action,
            'subject_type' => $subjectType,
            'subject_id' => $subjectId,
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'ip_address' => $ipAddress ?: null,
            'user_agent' => $userAgent ?: null,
        ]);
    }
}

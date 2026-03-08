<?php

declare(strict_types=1);

namespace App\Traits;

use App\Events\ModelChanged;
use Illuminate\Support\Facades\Auth;

trait Auditable
{
    public static function bootAuditable(): void
    {
        static::created(function ($model): void {
            $userId = self::resolveAuditUserId($model);
            $resourceType = strtolower(class_basename($model));

            ModelChanged::dispatch(
                "{$resourceType}_created",
                $resourceType,
                (string) $model->getKey(),
                $userId,
                [],
                $model->getAttributes(),
                [],
                request()?->ip(),
                request()?->userAgent(),
            );
        });

        static::updated(function ($model): void {
            $userId = self::resolveAuditUserId($model);
            $resourceType = strtolower(class_basename($model));
            $changes = $model->getChanges();

            // Don't log if nothing meaningful changed (e.g. only timestamps)
            $meaningfulChanges = array_diff_key($changes, array_flip(['updated_at', 'created_at']));
            if (empty($meaningfulChanges)) {
                return;
            }

            $before = [];
            $after = [];
            foreach ($meaningfulChanges as $key => $newValue) {
                $before[$key] = $model->getOriginal($key);
                $after[$key] = $newValue;
            }

            ModelChanged::dispatch(
                "{$resourceType}_updated",
                $resourceType,
                (string) $model->getKey(),
                $userId,
                $before,
                $after,
                [],
                request()?->ip(),
                request()?->userAgent(),
            );
        });

        static::deleted(function ($model): void {
            $userId = self::resolveAuditUserId($model);
            $resourceType = strtolower(class_basename($model));

            ModelChanged::dispatch(
                "{$resourceType}_deleted",
                $resourceType,
                (string) $model->getKey(),
                $userId,
                $model->getAttributes(),
                [],
                [],
                request()?->ip(),
                request()?->userAgent(),
            );
        });
    }

    private static function resolveAuditUserId(mixed $model): ?string
    {
        // Use the authenticated user if available
        $authUser = Auth::user();
        if ($authUser) {
            return (string) $authUser->getAuthIdentifier();
        }

        // Fall back to user_id on the model itself (e.g. item created by a user)
        if (isset($model->user_id)) {
            return (string) $model->user_id;
        }

        return null;
    }
}

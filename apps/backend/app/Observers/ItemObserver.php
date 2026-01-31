<?php

declare(strict_types=1);

namespace App\Observers;

use App\Models\Item;
use App\Services\DailyStatService;
use Carbon\Carbon;

final class ItemObserver
{
    /**
     * Increment created_count for today.  If the item was created already
     * in the "done" state (e.g. imported data), also bump completed_count.
     */
    public function created(Item $item): void
    {
        $userId = (string) $item->user_id;

        DailyStatService::incrementCreated($userId, $item->created_at);

        if ($item->status === 'done') {
            $completedDate = $item->completed_at
                ? Carbon::parse($item->completed_at)
                : $item->created_at;

            DailyStatService::incrementCompleted($userId, $completedDate);
        }
    }

    /**
     * Detect status transitions into / out of "done" and adjust
     * completed_count accordingly.  This event fires *before* the
     * database write, so getOriginal() still holds the previous values.
     */
    public function updating(Item $item): void
    {
        if (! $item->isDirty('status')) {
            return;
        }

        $userId    = (string) $item->user_id;
        $oldStatus  = $item->getOriginal('status');
        $newStatus  = $item->status;

        if ($oldStatus !== 'done' && $newStatus === 'done') {
            // Transitioning TO done – completed_at will be set to now() by the controller
            DailyStatService::incrementCompleted($userId, Carbon::now());
        } elseif ($oldStatus === 'done' && $newStatus !== 'done') {
            // Transitioning FROM done – decrement for the date it was originally completed
            $originalCompletedAt = $item->getOriginal('completed_at');
            $date = $originalCompletedAt ? Carbon::parse($originalCompletedAt) : Carbon::now();

            DailyStatService::decrementCompleted($userId, $date);
        }
    }
}

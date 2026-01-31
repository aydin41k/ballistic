<?php

declare(strict_types=1);

namespace App\Observers;

use App\Models\Item;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

final class ItemObserver
{
    /**
     * Handle the Item "created" event.
     * Increment created_count for the item's creation date.
     */
    public function created(Item $item): void
    {
        $userId = (string) $item->user_id;
        $this->incrementCreatedCount($userId, $item->created_at->toDateString());

        // If item is created with 'done' status, also increment completed_count
        if ($item->status === 'done' && $item->completed_at !== null) {
            $this->incrementCompletedCount($userId, $item->completed_at->toDateString());
        }
    }

    /**
     * Handle the Item "updated" event.
     * When status changes to 'done', increment completed_count.
     * When status changes from 'done' to something else, decrement completed_count.
     */
    public function updated(Item $item): void
    {
        $userId = (string) $item->user_id;
        $originalStatus = $item->getOriginal('status');
        $newStatus = $item->status;

        // Status changed to 'done' - increment completed count
        if ($newStatus === 'done' && $originalStatus !== 'done') {
            $completedDate = $item->completed_at?->toDateString() ?? now()->toDateString();
            $this->incrementCompletedCount($userId, $completedDate);
        }

        // Status changed from 'done' to something else - decrement completed count
        if ($originalStatus === 'done' && $newStatus !== 'done') {
            $originalCompletedAt = $item->getOriginal('completed_at');
            if ($originalCompletedAt !== null) {
                $completedDate = $originalCompletedAt->toDateString();
                $this->decrementCompletedCount($userId, $completedDate);
            }
        }
    }

    /**
     * Handle the Item "deleted" event (soft delete).
     * Decrement counts as appropriate.
     */
    public function deleted(Item $item): void
    {
        $userId = (string) $item->user_id;

        // Decrement created_count for the creation date
        $this->decrementCreatedCount($userId, $item->created_at->toDateString());

        // If item was completed, decrement completed_count
        if ($item->status === 'done' && $item->completed_at !== null) {
            $this->decrementCompletedCount($userId, $item->completed_at->toDateString());
        }
    }

    /**
     * Handle the Item "restored" event.
     * Re-increment counts when item is restored from soft delete.
     */
    public function restored(Item $item): void
    {
        $userId = (string) $item->user_id;
        $this->incrementCreatedCount($userId, $item->created_at->toDateString());

        if ($item->status === 'done' && $item->completed_at !== null) {
            $this->incrementCompletedCount($userId, $item->completed_at->toDateString());
        }
    }

    /**
     * Handle the Item "force deleted" event.
     * Same as soft delete for stats purposes.
     */
    public function forceDeleted(Item $item): void
    {
        // Force delete on a soft-deleted item shouldn't affect stats again
        // Only process if the item wasn't already soft-deleted
        if ($item->deleted_at === null) {
            $this->deleted($item);
        }
    }

    /**
     * Increment created_count using upsert for atomic operation.
     */
    private function incrementCreatedCount(string $userId, string $date): void
    {
        DB::table('daily_stats')->upsert(
            [
                'id' => Str::uuid()->toString(),
                'user_id' => $userId,
                'date' => $date,
                'created_count' => 1,
                'completed_count' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            ['user_id', 'date'],
            ['created_count' => DB::raw('created_count + 1'), 'updated_at' => now()]
        );
    }

    /**
     * Increment completed_count using upsert for atomic operation.
     */
    private function incrementCompletedCount(string $userId, string $date): void
    {
        DB::table('daily_stats')->upsert(
            [
                'id' => Str::uuid()->toString(),
                'user_id' => $userId,
                'date' => $date,
                'created_count' => 0,
                'completed_count' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            ['user_id', 'date'],
            ['completed_count' => DB::raw('completed_count + 1'), 'updated_at' => now()]
        );
    }

    /**
     * Decrement created_count (minimum 0).
     */
    private function decrementCreatedCount(string $userId, string $date): void
    {
        DB::table('daily_stats')
            ->where('user_id', $userId)
            ->where('date', $date)
            ->where('created_count', '>', 0)
            ->update([
                'created_count' => DB::raw('created_count - 1'),
                'updated_at' => now(),
            ]);
    }

    /**
     * Decrement completed_count (minimum 0).
     */
    private function decrementCompletedCount(string $userId, string $date): void
    {
        DB::table('daily_stats')
            ->where('user_id', $userId)
            ->where('date', $date)
            ->where('completed_count', '>', 0)
            ->update([
                'completed_count' => DB::raw('completed_count - 1'),
                'updated_at' => now(),
            ]);
    }
}

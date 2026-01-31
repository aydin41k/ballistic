<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class NotificationResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'type' => $this->type,
            'title' => $this->title,
            'message' => $this->message,
            'data' => $this->data,
            'read_at' => $this->read_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
            'created_at_human' => $this->formatRelativeTime($this->created_at),
        ];
    }

    /**
     * Format a datetime as a human-readable relative time.
     *
     * Examples:
     * - "Just now" (< 1 minute)
     * - "2 minutes ago"
     * - "1 hour ago"
     * - "Yesterday"
     * - "3 days ago"
     * - "2 weeks ago"
     * - "25 Jan" (> 4 weeks, same year)
     * - "25 Jan 2025" (different year)
     */
    private function formatRelativeTime(?\Illuminate\Support\Carbon $datetime): ?string
    {
        if ($datetime === null) {
            return null;
        }

        $now = now();
        $diffInSeconds = (int) abs($now->diffInSeconds($datetime));
        $diffInMinutes = (int) abs($now->diffInMinutes($datetime));
        $diffInHours = (int) abs($now->diffInHours($datetime));
        $diffInDays = (int) abs($now->diffInDays($datetime));

        // Just now (less than 1 minute ago)
        if ($diffInSeconds < 60) {
            return 'Just now';
        }

        // Minutes ago (1-59 minutes)
        if ($diffInMinutes < 60) {
            return $diffInMinutes === 1 ? '1 minute ago' : "{$diffInMinutes} minutes ago";
        }

        // Hours ago (1-23 hours)
        if ($diffInHours < 24) {
            return $diffInHours === 1 ? '1 hour ago' : "{$diffInHours} hours ago";
        }

        // Yesterday
        if ($datetime->isYesterday()) {
            return 'Yesterday';
        }

        // Days ago (2-6 days)
        if ($diffInDays < 7) {
            return "{$diffInDays} days ago";
        }

        // Weeks ago (1-4 weeks)
        $diffInWeeks = (int) ($diffInDays / 7);
        if ($diffInWeeks <= 4) {
            return $diffInWeeks === 1 ? '1 week ago' : "{$diffInWeeks} weeks ago";
        }

        // Older than 4 weeks - show date
        if ($datetime->year === $now->year) {
            return $datetime->format('j M');
        }

        return $datetime->format('j M Y');
    }
}

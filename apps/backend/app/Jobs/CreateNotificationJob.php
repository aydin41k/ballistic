<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Models\Notification;
use App\Models\User;
use App\Services\WebPushService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

final class CreateNotificationJob implements ShouldQueue
{
    use Queueable;

    /**
     * The number of times the job may be attempted.
     */
    public int $tries = 3;

    /**
     * The number of seconds to wait before retrying the job.
     */
    public int $backoff = 5;

    /**
     * Create a new job instance.
     *
     * @param  array<string, mixed>|null  $data
     */
    public function __construct(
        public readonly string $userId,
        public readonly string $type,
        public readonly string $title,
        public readonly string $message,
        public readonly ?array $data = null,
    ) {}

    /**
     * Execute the job.
     */
    public function handle(WebPushService $webPushService): void
    {
        // Create database notification
        $notification = Notification::create([
            'user_id' => $this->userId,
            'type' => $this->type,
            'title' => $this->title,
            'message' => $this->message,
            'data' => $this->data,
        ]);

        // Send Web Push notification
        $user = User::find($this->userId);

        if ($user) {
            $webPushService->sendToUser($user, [
                'title' => $this->title,
                'body' => $this->message,
                'icon' => '/icons/icon-192x192.png',
                'badge' => '/icons/badge-72x72.png',
                'data' => [
                    'notification_id' => $notification->id,
                    'type' => $this->type,
                    'url' => $this->getNotificationUrl(),
                    ...(array) $this->data,
                ],
            ]);
        }
    }

    /**
     * Get the URL to navigate to when the notification is clicked.
     */
    private function getNotificationUrl(): string
    {
        $appUrl = config('app.frontend_url', config('app.url', '/'));

        return match ($this->type) {
            'task_assigned', 'task_updated', 'task_completed' => $appUrl,
            'connection_request' => $appUrl . '/connections',
            'connection_accepted' => $appUrl . '/connections',
            default => $appUrl,
        };
    }
}

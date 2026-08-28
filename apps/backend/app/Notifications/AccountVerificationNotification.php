<?php

declare(strict_types=1);

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

final class AccountVerificationNotification extends Notification
{
    use Queueable;

    public function __construct(private readonly string $verificationUrl) {}

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Confirm your Ballistic account')
            ->greeting('Welcome to Ballistic')
            ->line('Confirm this email address, then complete the short human check to activate your account.')
            ->action('Confirm account', $this->verificationUrl)
            ->line('This link expires in 60 minutes. If you did not create this account, you can ignore this message.');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            //
        ];
    }
}

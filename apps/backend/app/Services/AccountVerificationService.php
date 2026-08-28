<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\User;
use App\Notifications\AccountVerificationNotification;
use Illuminate\Support\Facades\URL;
use InvalidArgumentException;

final readonly class AccountVerificationService
{
    public function __construct(private SmsService $smsService) {}

    public function send(User $user, string $channel, string $client = 'web'): void
    {
        $verificationUrl = $this->verificationUrl($user, $channel, $client);

        match ($channel) {
            'email' => $user->notify(new AccountVerificationNotification($verificationUrl)),
            'sms' => $this->smsService->send(
                $this->phoneFor($user),
                "Confirm your Ballistic account: {$verificationUrl} (expires in 60 minutes)",
            ),
            default => throw new InvalidArgumentException('Unsupported verification channel.'),
        };
    }

    public function verificationUrl(User $user, string $channel, string $client = 'web'): string
    {
        $destination = $channel === 'sms' ? $this->phoneFor($user) : $user->email;

        return URL::temporarySignedRoute(
            'account-verification.show',
            now()->addMinutes(60),
            [
                'user' => $user->getKey(),
                'channel' => $channel,
                'hash' => sha1($destination),
                'client' => $client,
            ],
        );
    }

    public function destination(User $user, string $channel): string
    {
        return $channel === 'sms'
            ? $this->maskPhone($this->phoneFor($user))
            : $this->maskEmail($user->email);
    }

    private function phoneFor(User $user): string
    {
        if (! is_string($user->phone) || $user->phone === '') {
            throw new InvalidArgumentException('A mobile number is required for SMS verification.');
        }

        return $user->phone;
    }

    private function maskEmail(string $email): string
    {
        [$local, $domain] = array_pad(explode('@', $email, 2), 2, '');

        return mb_substr($local, 0, 1).str_repeat('•', max(2, mb_strlen($local) - 1)).'@'.$domain;
    }

    private function maskPhone(string $phone): string
    {
        return str_repeat('•', max(0, strlen($phone) - 4)).substr($phone, -4);
    }
}

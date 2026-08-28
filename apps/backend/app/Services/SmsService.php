<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Http\Client\Factory as HttpFactory;
use RuntimeException;

final readonly class SmsService
{
    public function __construct(private HttpFactory $http) {}

    public function send(string $phone, string $message): void
    {
        $accountSid = config('services.twilio.account_sid');
        $authToken = config('services.twilio.auth_token');
        $from = config('services.twilio.from');

        if (! is_string($accountSid) || $accountSid === '' || ! is_string($authToken) || $authToken === '' || ! is_string($from) || $from === '') {
            throw new RuntimeException('SMS delivery is not configured.');
        }

        $response = $this->http
            ->asForm()
            ->withBasicAuth($accountSid, $authToken)
            ->timeout(10)
            ->post("https://api.twilio.com/2010-04-01/Accounts/{$accountSid}/Messages.json", [
                'From' => $from,
                'To' => $phone,
                'Body' => $message,
            ]);

        if ($response->failed()) {
            throw new RuntimeException('SMS delivery failed.');
        }
    }
}

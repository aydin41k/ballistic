<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Http\Client\Factory as HttpFactory;

final readonly class HumanCheckService
{
    public function __construct(private HttpFactory $http) {}

    public function verify(string $responseToken, ?string $ipAddress): bool
    {
        if ((bool) config('services.turnstile.bypass') && app()->environment(['local', 'testing'])) {
            return true;
        }

        $secret = config('services.turnstile.secret_key');
        if (! is_string($secret) || $secret === '' || $responseToken === '') {
            return false;
        }

        $response = $this->http
            ->asForm()
            ->timeout(10)
            ->post('https://challenges.cloudflare.com/turnstile/v0/siteverify', [
                'secret' => $secret,
                'response' => $responseToken,
                'remoteip' => $ipAddress,
            ]);

        return $response->successful() && $response->json('success') === true;
    }
}

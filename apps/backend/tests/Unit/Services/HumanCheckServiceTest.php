<?php

declare(strict_types=1);

namespace Tests\Unit\Services;

use App\Services\HumanCheckService;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

final class HumanCheckServiceTest extends TestCase
{
    public function test_it_accepts_a_successful_turnstile_response(): void
    {
        config()->set('services.turnstile.secret_key', 'secret');
        Http::fake([
            'challenges.cloudflare.com/*' => Http::response(['success' => true]),
        ]);

        $verified = app(HumanCheckService::class)->verify('response-token', '127.0.0.1');

        $this->assertTrue($verified);
        Http::assertSent(fn ($request): bool => $request['secret'] === 'secret'
            && $request['response'] === 'response-token'
            && $request['remoteip'] === '127.0.0.1');
    }

    public function test_it_fails_closed_without_configuration(): void
    {
        config()->set('services.turnstile.secret_key', null);

        $this->assertFalse(app(HumanCheckService::class)->verify('response-token', '127.0.0.1'));
        Http::assertNothingSent();
    }
}

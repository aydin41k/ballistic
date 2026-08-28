<?php

declare(strict_types=1);

namespace Tests\Unit\Services;

use App\Services\SmsService;
use Illuminate\Support\Facades\Http;
use RuntimeException;
use Tests\TestCase;

final class SmsServiceTest extends TestCase
{
    public function test_it_sends_an_sms_through_twilio(): void
    {
        config()->set([
            'services.twilio.account_sid' => 'AC123',
            'services.twilio.auth_token' => 'secret',
            'services.twilio.from' => '+61400000000',
        ]);
        Http::fake([
            'api.twilio.com/*' => Http::response(['sid' => 'SM123'], 201),
        ]);

        app(SmsService::class)->send('+61412345678', 'Confirm your account');

        Http::assertSent(fn ($request): bool => $request['From'] === '+61400000000'
            && $request['To'] === '+61412345678'
            && $request['Body'] === 'Confirm your account');
    }

    public function test_it_fails_when_twilio_is_not_configured(): void
    {
        config()->set('services.twilio.account_sid', null);

        $this->expectException(RuntimeException::class);

        app(SmsService::class)->send('+61412345678', 'Confirm your account');
    }
}

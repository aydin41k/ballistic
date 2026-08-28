<?php

declare(strict_types=1);

namespace Tests\Feature\Auth;

use App\Models\User;
use App\Notifications\AccountVerificationNotification;
use App\Services\AccountVerificationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Notification;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

final class ApiRegistrationVerificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_email_registration_sends_confirmation_without_authenticating(): void
    {
        Notification::fake();

        $response = $this->postJson('/api/register', $this->registrationPayload());

        $response
            ->assertAccepted()
            ->assertJsonPath('verification_channel', 'email')
            ->assertJsonMissingPath('token')
            ->assertJsonMissingPath('user');

        $user = User::where('email', 'new@example.com')->firstOrFail();
        $this->assertNull($user->account_verified_at);
        $this->assertNull($user->email_verified_at);
        Notification::assertSentTo($user, AccountVerificationNotification::class);
    }

    public function test_sms_registration_sends_confirmation_link(): void
    {
        config()->set([
            'services.twilio.account_sid' => 'AC123',
            'services.twilio.auth_token' => 'secret',
            'services.twilio.from' => '+61400000000',
        ]);
        Http::fake([
            'api.twilio.com/*' => Http::response(['sid' => 'SM123'], 201),
        ]);

        $response = $this->postJson('/api/register', [
            ...$this->registrationPayload(),
            'phone' => '+61412345678',
            'verification_channel' => 'sms',
        ]);

        $response
            ->assertAccepted()
            ->assertJsonPath('verification_channel', 'sms')
            ->assertJsonPath('destination', '••••••••5678');

        Http::assertSent(fn ($request): bool => $request->url() === 'https://api.twilio.com/2010-04-01/Accounts/AC123/Messages.json'
            && $request['To'] === '+61412345678'
            && str_contains($request['Body'], '/account-verification/'));
    }

    public function test_sms_registration_requires_an_international_mobile_number(): void
    {
        $this->postJson('/api/register', [
            ...$this->registrationPayload(),
            'phone' => '0412 345 678',
            'verification_channel' => 'sms',
        ])->assertUnprocessable()->assertJsonValidationErrors('phone');
    }

    public function test_unverified_account_cannot_log_in(): void
    {
        $user = User::factory()->unverified()->create([
            'email' => 'new@example.com',
            'account_verified_at' => null,
        ]);

        $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'password',
        ])->assertUnprocessable()->assertJsonValidationErrors('email');

        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_pending_account_can_request_a_fresh_email_confirmation(): void
    {
        Notification::fake();
        $user = User::factory()->unverified()->create(['account_verified_at' => null]);

        $this->postJson('/api/account-verification/resend', ['email' => $user->email])
            ->assertAccepted();

        Notification::assertSentTo($user, AccountVerificationNotification::class);
    }

    public function test_resend_does_not_reveal_whether_an_account_exists(): void
    {
        Notification::fake();

        $this->postJson('/api/account-verification/resend', ['email' => 'missing@example.com'])
            ->assertAccepted()
            ->assertJson([
                'message' => 'If that account is awaiting verification, a new email has been sent.',
            ]);

        Notification::assertNothingSent();
    }

    public function test_confirmation_link_opens_human_check_before_verifying_account(): void
    {
        $user = User::factory()->unverified()->create(['account_verified_at' => null]);
        $url = app(AccountVerificationService::class)->verificationUrl($user, 'email');

        $this->get($url)
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('auth/account-verification')
                ->where('channel', 'email')
                ->where('actionUrl', $url));

        $this->assertNull($user->fresh()->account_verified_at);
    }

    public function test_successful_human_check_verifies_account_and_contact(): void
    {
        config()->set('services.turnstile.bypass', true);
        config()->set('app.frontend_url', 'https://ballistic.example');
        $user = User::factory()->unverified()->create(['account_verified_at' => null]);
        $url = app(AccountVerificationService::class)->verificationUrl($user, 'email');

        $this->post($url, ['cf-turnstile-response' => 'test-token'])
            ->assertRedirect('https://ballistic.example/login?verified=1');

        $user->refresh();
        $this->assertNotNull($user->account_verified_at);
        $this->assertNotNull($user->email_verified_at);
    }

    public function test_failed_human_check_does_not_verify_account(): void
    {
        config()->set('services.turnstile.secret_key', 'secret');
        Http::fake([
            'challenges.cloudflare.com/*' => Http::response(['success' => false]),
        ]);
        $user = User::factory()->unverified()->create(['account_verified_at' => null]);
        $url = app(AccountVerificationService::class)->verificationUrl($user, 'email');

        $this->from($url)
            ->post($url, ['cf-turnstile-response' => 'bad-token'])
            ->assertRedirect($url)
            ->assertSessionHasErrors('human_check');

        $this->assertNull($user->fresh()->account_verified_at);
    }

    public function test_mobile_confirmation_returns_to_the_mobile_login_screen(): void
    {
        config()->set('services.turnstile.bypass', true);
        config()->set('app.mobile_url', 'ballistic://login');
        $user = User::factory()->unverified()->create(['account_verified_at' => null]);
        $url = app(AccountVerificationService::class)->verificationUrl($user, 'email', 'mobile');

        $this->post($url, ['cf-turnstile-response' => 'test-token'])
            ->assertRedirect('ballistic://login?verified=1');
    }

    public function test_tampered_confirmation_link_is_rejected(): void
    {
        $user = User::factory()->unverified()->create(['account_verified_at' => null]);
        $url = app(AccountVerificationService::class)->verificationUrl($user, 'email');

        $this->get($url.'&channel=sms')->assertForbidden();
    }

    /**
     * @return array<string, string>
     */
    private function registrationPayload(): array
    {
        return [
            'name' => 'New User',
            'email' => 'new@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'verification_channel' => 'email',
        ];
    }
}

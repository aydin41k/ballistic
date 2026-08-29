<?php

declare(strict_types=1);

namespace Tests\Feature\Auth;

use App\Auth\TokenAbility;
use App\Models\SocialAccount;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\User as GoogleUser;
use Mockery;
use Tests\TestCase;

final class GoogleAuthenticationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config()->set([
            'services.google.client_id' => 'google-client-id',
            'services.google.client_secret' => 'google-client-secret',
            'services.google.redirect' => 'https://api.example.com/api/auth/google/callback',
            'app.google_auth_callback_url' => 'https://app.example.com/auth/google/callback',
            'app.mobile_url' => 'ballistic://login',
        ]);
    }

    public function test_redirect_returns_google_url_with_single_use_state(): void
    {
        $response = $this->postJson('/api/auth/google/redirect', [
            'client' => 'web',
            'device_name' => 'Safari on macOS',
        ])->assertOk();

        $url = (string) $response->json('url');
        $query = $this->queryFromUrl($url);

        $this->assertSame('google-client-id', $query['client_id']);
        $this->assertSame('https://api.example.com/api/auth/google/callback', $query['redirect_uri']);
        $this->assertSame('select_account', $query['prompt']);
        $this->assertSame(64, strlen($query['state']));
    }

    public function test_invalid_or_reused_state_is_rejected(): void
    {
        $this->get('/api/auth/google/callback?state=invalid')
            ->assertRedirect('https://app.example.com/auth/google/callback?error=invalid_state');

        $state = $this->beginGoogleAuthentication();
        $this->mockGoogleUser($this->googleUser());

        $this->get('/api/auth/google/callback?state='.$state)->assertRedirectContains('code=');
        $this->get('/api/auth/google/callback?state='.$state)
            ->assertRedirect('https://app.example.com/auth/google/callback?error=invalid_state');
    }

    public function test_verified_google_account_creates_verified_user_and_social_identity(): void
    {
        $state = $this->beginGoogleAuthentication();
        $this->mockGoogleUser($this->googleUser());

        $this->get('/api/auth/google/callback?state='.$state)->assertRedirectContains('code=');

        $user = User::query()->where('email', 'person@example.com')->firstOrFail();
        $this->assertSame('Google Person', $user->name);
        $this->assertNotNull($user->email_verified_at);
        $this->assertNotNull($user->account_verified_at);
        $this->assertDatabaseHas('social_accounts', [
            'user_id' => $user->id,
            'provider' => 'google',
            'provider_user_id' => 'google-123',
            'provider_email' => 'person@example.com',
        ]);
    }

    public function test_verified_google_email_links_an_existing_user(): void
    {
        $existing = User::factory()->unverified()->create(['email' => 'Person@Example.com']);
        $state = $this->beginGoogleAuthentication();
        $this->mockGoogleUser($this->googleUser());

        $this->get('/api/auth/google/callback?state='.$state)->assertRedirectContains('code=');

        $this->assertDatabaseCount('users', 1);
        $this->assertDatabaseHas('social_accounts', ['user_id' => $existing->id]);
        $this->assertNotNull($existing->fresh()->account_verified_at);
    }

    public function test_existing_provider_identity_takes_precedence_over_a_changed_email(): void
    {
        $linkedUser = User::factory()->create(['email' => 'old@example.com']);
        $otherUser = User::factory()->create(['email' => 'person@example.com']);
        SocialAccount::query()->create([
            'user_id' => $linkedUser->id,
            'provider' => 'google',
            'provider_user_id' => 'google-123',
            'provider_email' => $linkedUser->email,
        ]);
        $state = $this->beginGoogleAuthentication();
        $this->mockGoogleUser($this->googleUser());

        $callback = $this->get('/api/auth/google/callback?state='.$state);
        $code = $this->queryFromUrl((string) $callback->headers->get('Location'))['code'];
        $this->postJson('/api/auth/google/exchange', ['code' => $code])
            ->assertOk()
            ->assertJsonPath('user.id', (string) $linkedUser->id);
        $this->assertNotSame($linkedUser->id, $otherUser->id);
    }

    public function test_unverified_google_email_is_rejected(): void
    {
        $state = $this->beginGoogleAuthentication();
        $this->mockGoogleUser($this->googleUser(['verified_email' => false]));

        $this->get('/api/auth/google/callback?state='.$state)
            ->assertRedirect('https://app.example.com/auth/google/callback?error=authentication_failed');

        $this->assertDatabaseCount('users', 0);
        $this->assertDatabaseCount('social_accounts', 0);
    }

    public function test_missing_google_email_is_rejected(): void
    {
        $state = $this->beginGoogleAuthentication();
        $this->mockGoogleUser($this->googleUser(['email' => null]));

        $this->get('/api/auth/google/callback?state='.$state)
            ->assertRedirect('https://app.example.com/auth/google/callback?error=authentication_failed');

        $this->assertDatabaseCount('users', 0);
        $this->assertDatabaseCount('social_accounts', 0);
    }

    public function test_mobile_callback_returns_to_the_app(): void
    {
        $state = $this->beginGoogleAuthentication('mobile');
        $this->mockGoogleUser($this->googleUser());

        $response = $this->get('/api/auth/google/callback?state='.$state);

        $response->assertRedirectContains('ballistic://login?code=');
    }

    public function test_exchange_code_issues_api_token_once(): void
    {
        $state = $this->beginGoogleAuthentication();
        $this->mockGoogleUser($this->googleUser());
        $callback = $this->get('/api/auth/google/callback?state='.$state);
        $code = $this->queryFromUrl((string) $callback->headers->get('Location'))['code'];
        $response = $this->postJson('/api/auth/google/exchange', ['code' => $code])
            ->assertOk()
            ->assertJsonPath('user.email', 'person@example.com')
            ->assertJsonStructure(['message', 'user', 'token']);

        $this->assertNotSame('', $response->json('token'));
        $this->assertDatabaseHas('personal_access_tokens', [
            'name' => 'Test browser',
            'abilities' => json_encode([TokenAbility::Api->value]),
        ]);

        $this->postJson('/api/auth/google/exchange', ['code' => $code])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('code');
        $this->assertDatabaseCount('personal_access_tokens', 1);
    }

    private function beginGoogleAuthentication(string $client = 'web'): string
    {
        $url = (string) $this->postJson('/api/auth/google/redirect', [
            'client' => $client,
            'device_name' => 'Test browser',
        ])->assertOk()->json('url');

        return $this->queryFromUrl($url)['state'];
    }

    /** @param array<string, mixed> $overrides */
    private function googleUser(array $overrides = []): GoogleUser
    {
        return GoogleUser::fake(array_merge([
            'id' => 'google-123',
            'name' => 'Google Person',
            'email' => 'person@example.com',
            'avatar' => 'https://example.com/avatar.png',
            'verified_email' => true,
        ], $overrides));
    }

    private function mockGoogleUser(GoogleUser $user): void
    {
        $provider = Mockery::mock();
        $provider->shouldReceive('stateless')->once()->andReturnSelf();
        $provider->shouldReceive('user')->once()->andReturn($user);
        Socialite::shouldReceive('driver')->once()->with('google')->andReturn($provider);
    }

    /** @return array<string, string> */
    private function queryFromUrl(string $url): array
    {
        $query = parse_url($url, PHP_URL_QUERY);
        $values = [];
        parse_str(is_string($query) ? $query : '', $values);

        return $values;
    }
}

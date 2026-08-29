<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\SocialAccount;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Laravel\Socialite\AbstractUser as SocialiteUser;
use Laravel\Socialite\Facades\Socialite;
use RuntimeException;

final class GoogleAuthService
{
    private const string Provider = 'google';

    private const int StateLifetimeMinutes = 10;

    private const int ExchangeLifetimeMinutes = 2;

    public function authorisationUrl(string $client, string $deviceName): string
    {
        $this->ensureConfigured();

        $state = Str::random(64);
        Cache::put($this->stateCacheKey($state), [
            'client' => $client,
            'device_name' => $deviceName,
        ], now()->addMinutes(self::StateLifetimeMinutes));

        return Socialite::driver(self::Provider)
            ->stateless()
            ->scopes(['openid', 'profile', 'email'])
            ->with(['state' => $state, 'prompt' => 'select_account'])
            ->redirect()
            ->getTargetUrl();
    }

    /** @return array{client: string, device_name: string}|null */
    public function consumeState(?string $state): ?array
    {
        if (! is_string($state) || strlen($state) !== 64) {
            return null;
        }

        $payload = $this->pull($this->stateCacheKey($state));

        if (! is_array($payload)
            || ! in_array($payload['client'] ?? null, ['web', 'mobile'], true)
            || ! is_string($payload['device_name'] ?? null)) {
            return null;
        }

        return ['client' => $payload['client'], 'device_name' => $payload['device_name']];
    }

    public function userFromGoogle(): SocialiteUser
    {
        return Socialite::driver(self::Provider)->stateless()->user();
    }

    public function authenticate(SocialiteUser $googleUser): User
    {
        $providerUserId = trim((string) $googleUser->getId());
        $email = Str::lower(trim((string) $googleUser->getEmail()));
        $providerData = is_array($googleUser->user) ? $googleUser->user : [];
        $emailIsVerified = ($providerData['verified_email'] ?? $providerData['email_verified'] ?? false) === true;

        if ($providerUserId === '' || $email === '' || filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
            throw ValidationException::withMessages([
                'google' => ['Google did not provide a valid account email.'],
            ]);
        }

        if (! $emailIsVerified) {
            throw ValidationException::withMessages([
                'google' => ['Your Google email address must be verified.'],
            ]);
        }

        /** @var array{0: User, 1: bool} $result */
        $result = DB::transaction(function () use ($googleUser, $providerUserId, $email): array {
            $socialAccount = SocialAccount::query()
                ->where('provider', self::Provider)
                ->where('provider_user_id', $providerUserId)
                ->lockForUpdate()
                ->first();

            if ($socialAccount !== null) {
                $socialAccount->update([
                    'provider_email' => $email,
                    'avatar_url' => $googleUser->getAvatar(),
                ]);

                return [$socialAccount->user()->firstOrFail(), false];
            }

            $user = User::query()
                ->whereRaw('LOWER(email) = ?', [$email])
                ->lockForUpdate()
                ->first();
            $created = false;

            if ($user === null) {
                $user = User::forceCreate([
                    'name' => $this->displayName($googleUser, $email),
                    'email' => $email,
                    'email_verified_at' => now(),
                    'account_verified_at' => now(),
                    'avatar_url' => $googleUser->getAvatar(),
                    'password' => Hash::make(Str::random(64)),
                ]);
                $created = true;
            } else {
                $user->forceFill([
                    'email_verified_at' => $user->email_verified_at ?? now(),
                    'account_verified_at' => $user->account_verified_at ?? now(),
                ])->save();
            }

            $user->socialAccounts()->create([
                'provider' => self::Provider,
                'provider_user_id' => $providerUserId,
                'provider_email' => $email,
                'avatar_url' => $googleUser->getAvatar(),
            ]);

            return [$user, $created];
        });

        [$user, $created] = $result;

        if ($created) {
            event(new Registered($user));
        }

        return $user;
    }

    public function createExchangeCode(User $user, string $deviceName): string
    {
        $code = Str::random(64);
        Cache::put($this->exchangeCacheKey($code), [
            'user_id' => (string) $user->getKey(),
            'device_name' => $deviceName,
        ], now()->addMinutes(self::ExchangeLifetimeMinutes));

        return $code;
    }

    /** @return array{user: User, device_name: string}|null */
    public function consumeExchangeCode(string $code): ?array
    {
        if (strlen($code) !== 64) {
            return null;
        }

        $payload = $this->pull($this->exchangeCacheKey($code));

        if (! is_array($payload)
            || ! is_string($payload['user_id'] ?? null)
            || ! is_string($payload['device_name'] ?? null)) {
            return null;
        }

        $user = User::query()->find($payload['user_id']);

        if ($user === null) {
            return null;
        }

        return ['user' => $user, 'device_name' => $payload['device_name']];
    }

    public function callbackUrl(string $client, string $parameter, string $value): string
    {
        $baseUrl = $client === 'mobile'
            ? (string) config('app.mobile_url')
            : (string) config('app.google_auth_callback_url');
        $separator = str_contains($baseUrl, '?') ? '&' : '?';

        return $baseUrl.$separator.http_build_query([$parameter => $value]);
    }

    private function ensureConfigured(): void
    {
        if (blank(config('services.google.client_id')) || blank(config('services.google.client_secret'))) {
            throw new RuntimeException('Google authentication is not configured.');
        }
    }

    private function displayName(SocialiteUser $googleUser, string $email): string
    {
        $name = trim((string) $googleUser->getName());

        return $name !== '' ? $name : Str::before($email, '@');
    }

    private function stateCacheKey(string $state): string
    {
        return 'google-auth:state:'.hash('sha256', $state);
    }

    private function exchangeCacheKey(string $code): string
    {
        return 'google-auth:exchange:'.hash('sha256', $code);
    }

    private function pull(string $key): mixed
    {
        return Cache::lock($key.':lock', 5)->block(2, fn (): mixed => Cache::pull($key));
    }
}

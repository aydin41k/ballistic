<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Auth\TokenAbility;
use App\Http\Middleware\EnsureApiTokenAbility;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Tests\TestCase;

final class EnsureApiTokenAbilityTest extends TestCase
{
    use RefreshDatabase;

    public function test_allows_api_scoped_token(): void
    {
        $user = User::factory()->create();
        $accessToken = $user->createToken('api', [TokenAbility::Api->value])->accessToken;
        $request = $this->requestFor($user->withAccessToken($accessToken));

        $response = $this->middleware()->handle($request, fn () => response('ok'));

        $this->assertSame(200, $response->getStatusCode());
    }

    public function test_allows_wildcard_token(): void
    {
        $user = User::factory()->create();
        $accessToken = $user->createToken('legacy')->accessToken;
        $request = $this->requestFor($user->withAccessToken($accessToken));

        $response = $this->middleware()->handle($request, fn () => response('ok'));

        $this->assertSame(200, $response->getStatusCode());
    }

    public function test_rejects_mcp_scoped_token(): void
    {
        $user = User::factory()->create();
        $accessToken = $user->createToken('mcp', [TokenAbility::Mcp->value])->accessToken;
        $request = $this->requestFor($user->withAccessToken($accessToken));

        $response = $this->middleware()->handle($request, fn () => response('ok'));

        $this->assertSame(403, $response->getStatusCode());
        $this->assertSame(
            'Token missing API scope.',
            $response->getData(true)['message']
        );
    }

    public function test_allows_session_authenticated_request_without_personal_token(): void
    {
        // Session auth (Inertia web routes) returns a TransientToken, not PersonalAccessToken.
        // The middleware must pass these through unconditionally.
        $user = User::factory()->create();
        $user->withAccessToken(new \Laravel\Sanctum\TransientToken);
        $request = $this->requestFor($user);

        $response = $this->middleware()->handle($request, fn () => response('ok'));

        $this->assertSame(200, $response->getStatusCode());
    }

    public function test_allows_unauthenticated_request_to_pass_through(): void
    {
        // Unauthenticated requests have no user; auth middleware upstream handles
        // the 401, so this middleware should not block them.
        $request = Request::create('/api/test', 'GET');
        $request->setUserResolver(fn () => null);

        $response = $this->middleware()->handle($request, fn () => response('ok'));

        $this->assertSame(200, $response->getStatusCode());
    }

    private function middleware(): EnsureApiTokenAbility
    {
        return app(EnsureApiTokenAbility::class);
    }

    private function requestFor(User $user): Request
    {
        $request = Request::create('/api/test', 'GET');
        $request->setUserResolver(fn () => $user);

        return $request;
    }
}

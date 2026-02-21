<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Auth\TokenAbility;
use App\Http\Middleware\EnsureMcpTokenAbility;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Tests\TestCase;

final class EnsureMcpTokenAbilityTest extends TestCase
{
    use RefreshDatabase;

    public function test_allows_mcp_scoped_token(): void
    {
        $user = User::factory()->create();
        $accessToken = $user->createToken('mcp', [TokenAbility::MCP])->accessToken;
        $request = $this->requestFor($user->withAccessToken($accessToken));

        $response = $this->middleware()->handle($request, fn () => response('ok'));

        $this->assertSame(200, $response->getStatusCode());
    }

    public function test_rejects_api_scoped_token(): void
    {
        $user = User::factory()->create();
        $accessToken = $user->createToken('api', [TokenAbility::API])->accessToken;
        $request = $this->requestFor($user->withAccessToken($accessToken));

        $response = $this->middleware()->handle($request, fn () => response('ok'));

        $this->assertSame(403, $response->getStatusCode());
        $this->assertSame(
            'Token missing MCP scope. Create a dedicated MCP token.',
            $response->getData(true)['error']['message']
        );
    }

    public function test_allows_legacy_wildcard_before_cutoff(): void
    {
        config()->set('mcp.legacy_wildcard_cutoff_at', now()->addDay()->toIso8601String());

        $user = User::factory()->create();
        $accessToken = $user->createToken('legacy')->accessToken;
        $request = $this->requestFor($user->withAccessToken($accessToken));

        $response = $this->middleware()->handle($request, fn () => response('ok'));

        $this->assertSame(200, $response->getStatusCode());
        $this->assertSame('deprecated', $response->headers->get('X-Ballistic-MCP-Legacy-Token'));
    }

    public function test_rejects_legacy_wildcard_after_cutoff(): void
    {
        config()->set('mcp.legacy_wildcard_cutoff_at', now()->subDay()->toIso8601String());

        $user = User::factory()->create();
        $accessToken = $user->createToken('legacy')->accessToken;
        $request = $this->requestFor($user->withAccessToken($accessToken));

        $response = $this->middleware()->handle($request, fn () => response('ok'));

        $this->assertSame(403, $response->getStatusCode());
        $this->assertSame(
            'Token missing MCP scope. Create a dedicated MCP token.',
            $response->getData(true)['error']['message']
        );
    }

    private function middleware(): EnsureMcpTokenAbility
    {
        return app(EnsureMcpTokenAbility::class);
    }

    private function requestFor(User $user): Request
    {
        $request = Request::create('/mcp', 'POST');
        $request->setUserResolver(fn () => $user);

        return $request;
    }
}

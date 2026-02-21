<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Auth\TokenAbility;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class TokenAbilityTest extends TestCase
{
    use RefreshDatabase;

    // --- isLegacyWildcardAllowedForMcp ---

    public function test_legacy_wildcard_allowed_before_cutoff(): void
    {
        config()->set('mcp.legacy_wildcard_cutoff_at', now()->addHour()->toIso8601String());

        $this->assertTrue(TokenAbility::isLegacyWildcardAllowedForMcp());
    }

    public function test_legacy_wildcard_disallowed_after_cutoff(): void
    {
        config()->set('mcp.legacy_wildcard_cutoff_at', now()->subHour()->toIso8601String());

        $this->assertFalse(TokenAbility::isLegacyWildcardAllowedForMcp());
    }

    public function test_legacy_wildcard_disallowed_when_cutoff_is_empty(): void
    {
        config()->set('mcp.legacy_wildcard_cutoff_at', '');

        $this->assertFalse(TokenAbility::isLegacyWildcardAllowedForMcp());
    }

    public function test_legacy_wildcard_disallowed_when_cutoff_is_null(): void
    {
        config()->set('mcp.legacy_wildcard_cutoff_at', null);

        $this->assertFalse(TokenAbility::isLegacyWildcardAllowedForMcp());
    }

    public function test_legacy_wildcard_disallowed_when_cutoff_is_malformed(): void
    {
        config()->set('mcp.legacy_wildcard_cutoff_at', 'not-a-date');

        $this->assertFalse(TokenAbility::isLegacyWildcardAllowedForMcp());
    }

    // --- hasExplicitAbility ---

    public function test_has_explicit_ability_returns_true_for_matching_ability(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test', [TokenAbility::Api->value])->accessToken;

        $this->assertTrue(TokenAbility::hasExplicitAbility($token, TokenAbility::Api));
    }

    public function test_has_explicit_ability_returns_false_for_non_matching_ability(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test', [TokenAbility::Api->value])->accessToken;

        $this->assertFalse(TokenAbility::hasExplicitAbility($token, TokenAbility::Mcp));
    }

    public function test_has_explicit_ability_returns_false_when_abilities_is_empty(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test', [])->accessToken;

        $this->assertFalse(TokenAbility::hasExplicitAbility($token, TokenAbility::Api));
    }

    // --- isWildcardToken ---

    public function test_is_wildcard_token_returns_true_for_wildcard(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('legacy')->accessToken;

        $this->assertTrue(TokenAbility::isWildcardToken($token));
    }

    public function test_is_wildcard_token_returns_false_for_scoped_token(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('scoped', [TokenAbility::Mcp->value])->accessToken;

        $this->assertFalse(TokenAbility::isWildcardToken($token));
    }

    // --- enum values ---

    public function test_enum_values_match_sanctum_ability_strings(): void
    {
        $this->assertSame('api:*', TokenAbility::Api->value);
        $this->assertSame('mcp:*', TokenAbility::Mcp->value);
        $this->assertSame('*', TokenAbility::Wildcard->value);
    }
}

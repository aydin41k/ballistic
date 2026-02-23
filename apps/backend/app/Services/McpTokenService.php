<?php

declare(strict_types=1);

namespace App\Services;

use App\Auth\TokenAbility;
use App\Models\User;
use Illuminate\Support\Collection;
use Laravel\Sanctum\NewAccessToken;
use Laravel\Sanctum\PersonalAccessToken;

final class McpTokenService
{
    /**
     * @return Collection<int, PersonalAccessToken>
     */
    public function listTokens(User $user): Collection
    {
        $query = $user->tokens()->where(function ($q): void {
            $q->whereJsonContains('abilities', TokenAbility::Mcp->value);

            if (TokenAbility::isLegacyWildcardAllowedForMcp()) {
                $q->orWhereJsonContains('abilities', TokenAbility::Wildcard->value);
            }
        });

        return $query->get();
    }

    public function createToken(User $user, string $name): NewAccessToken
    {
        return $user->createToken($name, [TokenAbility::Mcp->value]);
    }

    public function revokeToken(User $user, string $tokenId): bool
    {
        $token = $user->tokens()->where('id', $tokenId)->first();

        if (! $token instanceof PersonalAccessToken) {
            return false;
        }

        $isMcpToken = TokenAbility::hasExplicitAbility($token, TokenAbility::Mcp);
        $isLegacyWildcardToken = TokenAbility::isLegacyWildcardAllowedForMcp()
            && TokenAbility::isWildcardToken($token);

        if (! $isMcpToken && ! $isLegacyWildcardToken) {
            return false;
        }

        return (bool) $token->delete();
    }
}

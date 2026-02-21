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
        $includeLegacyWildcard = TokenAbility::isLegacyWildcardAllowedForMcp();

        return $user->tokens
            ->filter(function (PersonalAccessToken $token) use ($includeLegacyWildcard): bool {
                if (TokenAbility::hasExplicitAbility($token, TokenAbility::MCP)) {
                    return true;
                }

                return $includeLegacyWildcard && TokenAbility::isWildcardToken($token);
            })
            ->values();
    }

    public function createToken(User $user, string $name): NewAccessToken
    {
        return $user->createToken($name, [TokenAbility::MCP]);
    }

    public function revokeToken(User $user, string $tokenId): bool
    {
        $token = $user->tokens()->where('id', $tokenId)->first();

        if (! $token instanceof PersonalAccessToken) {
            return false;
        }

        $includeLegacyWildcard = TokenAbility::isLegacyWildcardAllowedForMcp();
        $isMcpToken = TokenAbility::hasExplicitAbility($token, TokenAbility::MCP);
        $isLegacyWildcardToken = $includeLegacyWildcard && TokenAbility::isWildcardToken($token);

        if (! $isMcpToken && ! $isLegacyWildcardToken) {
            return false;
        }

        return $token->delete();
    }

    /**
     * @return array{id:string,name:string,created_at:string,last_used_at:string|null,is_legacy_wildcard:bool}
     */
    public function toPayload(PersonalAccessToken $token): array
    {
        return [
            'id' => (string) $token->id,
            'name' => $token->name,
            'created_at' => $token->created_at?->toIso8601String() ?? now()->toIso8601String(),
            'last_used_at' => $token->last_used_at?->toIso8601String(),
            'is_legacy_wildcard' => TokenAbility::isWildcardToken($token) && ! TokenAbility::hasExplicitAbility($token, TokenAbility::MCP),
        ];
    }
}

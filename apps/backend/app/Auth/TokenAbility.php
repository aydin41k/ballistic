<?php

declare(strict_types=1);

namespace App\Auth;

use Carbon\CarbonImmutable;
use Laravel\Sanctum\PersonalAccessToken;

enum TokenAbility: string
{
    case Api = 'api:*';

    case Mcp = 'mcp:*';

    case Wildcard = '*';

    public static function isLegacyWildcardAllowedForMcp(): bool
    {
        $cutoff = config('mcp.legacy_wildcard_cutoff_at');

        if (! is_string($cutoff) || trim($cutoff) === '') {
            return false;
        }

        try {
            return now()->lt(CarbonImmutable::parse($cutoff));
        } catch (\Throwable) {
            return false;
        }
    }

    public static function hasExplicitAbility(PersonalAccessToken $token, self $ability): bool
    {
        $abilities = $token->abilities;

        if (! is_array($abilities)) {
            return false;
        }

        return in_array($ability->value, $abilities, true);
    }

    public static function isWildcardToken(PersonalAccessToken $token): bool
    {
        return self::hasExplicitAbility($token, self::Wildcard);
    }
}

<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Auth\TokenAbility;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Laravel\Sanctum\PersonalAccessToken;

/**
 * @mixin PersonalAccessToken
 */
final class McpTokenResource extends JsonResource
{
    /**
     * @return array{id:string,name:string,created_at:string|null,last_used_at:string|null,is_legacy_wildcard:bool}
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'name' => $this->name,
            'created_at' => $this->created_at?->toIso8601String(),
            'last_used_at' => $this->last_used_at?->toIso8601String(),
            'is_legacy_wildcard' => TokenAbility::isWildcardToken($this->resource)
                && ! TokenAbility::hasExplicitAbility($this->resource, TokenAbility::Mcp),
        ];
    }
}

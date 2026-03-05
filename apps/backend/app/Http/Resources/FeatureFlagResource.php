<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\FeatureFlag
 */
final class FeatureFlagResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'key' => $this->key,
            'enabled' => $this->enabled,
            'label' => $this->label,
            'description' => $this->description,
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}

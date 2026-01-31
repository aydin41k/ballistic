<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class UserLookupResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    #[\Override]
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email_masked' => $this->maskEmail($this->email),
        ];
    }

    /**
     * Mask an email address for privacy.
     *
     * Example: "john.doe@example.com" -> "j***@example.com"
     */
    private function maskEmail(string $email): string
    {
        $parts = explode('@', $email);
        if (count($parts) !== 2) {
            return $email;
        }

        $local = $parts[0];
        $domain = $parts[1];

        $maskedLocal = strlen($local) > 1
            ? $local[0].'***'
            : $local.'***';

        return $maskedLocal.'@'.$domain;
    }
}

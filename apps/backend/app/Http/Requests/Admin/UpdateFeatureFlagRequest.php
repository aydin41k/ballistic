<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

final class UpdateFeatureFlagRequest extends FormRequest
{
    /**
     * Authorisation is already enforced by the 'admin' middleware on the
     * route group, so this always returns true.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, list<string>>
     */
    public function rules(): array
    {
        return [
            'enabled' => ['required', 'boolean'],
            // label / description are optional so admins can toggle without
            // re-submitting metadata. When creating a brand-new key the
            // controller defaults the label to a humanised form of the key.
            'label' => ['sometimes', 'nullable', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string', 'max:500'],
        ];
    }
}

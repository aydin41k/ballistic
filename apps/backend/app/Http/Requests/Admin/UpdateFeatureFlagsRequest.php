<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

final class UpdateFeatureFlagsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'dates' => ['sometimes', 'boolean'],
            'delegation' => ['sometimes', 'boolean'],
            'ai_assistant' => ['sometimes', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'dates.boolean' => 'The dates flag must be true or false.',
            'delegation.boolean' => 'The delegation flag must be true or false.',
            'ai_assistant.boolean' => 'The AI assistant flag must be true or false.',
        ];
    }

    /**
     * Only allow the known feature flag keys through.
     *
     * @return array<string, bool>
     */
    public function featureFlags(): array
    {
        return array_intersect_key(
            $this->validated(),
            array_flip(['dates', 'delegation', 'ai_assistant'])
        );
    }
}

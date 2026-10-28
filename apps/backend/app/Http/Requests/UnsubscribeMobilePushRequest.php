<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

final class UnsubscribeMobilePushRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'expo_push_token' => [
                'required',
                'string',
                'max:255',
                'regex:/^(Expo|Exponent)PushToken\[[A-Za-z0-9_-]+\]$/',
            ],
        ];
    }
}

<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class SubscribePushRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Auth handled by middleware
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'endpoint' => ['required', 'string', 'url', 'max:500'],
            'keys.p256dh' => ['required', 'string', 'max:100'],
            'keys.auth' => ['required', 'string', 'max:50'],
        ];
    }

    /**
     * Get custom messages for validation errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'endpoint.required' => 'Push subscription endpoint is required.',
            'endpoint.url' => 'Push subscription endpoint must be a valid URL.',
            'keys.p256dh.required' => 'Push subscription p256dh key is required.',
            'keys.auth.required' => 'Push subscription auth key is required.',
        ];
    }
}

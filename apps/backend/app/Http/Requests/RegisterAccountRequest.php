<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

final class RegisterAccountRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        if (! $this->has('verification_channel')) {
            $this->merge(['verification_channel' => 'email']);
        }
    }

    /**
     * Determine if the user is authorised to make this request.
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
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', Rule::unique(User::class)],
            'phone' => [
                'nullable',
                'string',
                'regex:/^\+[1-9]\d{7,14}$/',
                'max:20',
                Rule::unique(User::class),
            ],
            'verification_channel' => ['required', Rule::in(['email'])],
            'password' => ['required', 'confirmed', Password::defaults()],
            'device_name' => ['nullable', 'string', 'max:255'],
        ];
    }

    /**
     * Get custom validation messages.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'phone.regex' => 'Enter the mobile number in international format, such as +61412345678.',
        ];
    }
}

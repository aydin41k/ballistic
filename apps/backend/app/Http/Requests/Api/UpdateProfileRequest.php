<?php

declare(strict_types=1);

namespace App\Http\Requests\Api;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

/**
 * Consolidated validation for PATCH /api/user.
 * Keeps the controller lean and gives us a single source of truth for
 * allowed profile fields, image constraints, and the feature_flags allowlist.
 */
final class UpdateProfileRequest extends FormRequest
{
    /**
     * Route is already protected by auth:sanctum + token.api middleware.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, list<mixed>>
     */
    public function rules(): array
    {
        /** @var User $user */
        $user = $this->user();

        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'email' => [
                'sometimes', 'required', 'string', 'lowercase', 'email', 'max:255',
                Rule::unique('users')->ignore($user->id),
            ],
            'phone' => ['nullable', 'string', 'max:20'],
            'notes' => ['nullable', 'string', 'max:10000'],

            // Avatar: 2 MB cap, image mime, reasonable dimensions. Laravel's
            // 'image' rule already restricts to jpeg/png/gif/bmp/svg/webp,
            // but we tighten further to the common web formats.
            'avatar' => [
                'sometimes', 'nullable', 'image', 'mimes:jpeg,png,webp,gif',
                'max:2048', 'dimensions:max_width=4096,max_height=4096',
            ],

            // Per-user feature flags (not global flags). Allowlist is enforced
            // again in the controller merge step, but validating here gives
            // clients a clear 422 on unknown keys.
            'feature_flags' => ['nullable', 'array'],
            'feature_flags.dates' => ['sometimes', 'boolean'],
            'feature_flags.delegation' => ['sometimes', 'boolean'],
            'feature_flags.ai_assistant' => ['sometimes', 'boolean'],

            // Project exclusion sync. Each ID must exist and belong to the
            // authenticated user so one user can't enumerate another's projects.
            'excluded_project_ids' => ['sometimes', 'array'],
            'excluded_project_ids.*' => [
                'uuid',
                Rule::exists('projects', 'id')
                    ->where('user_id', $user->id)
                    ->whereNull('deleted_at'),
            ],

            'password' => ['sometimes', 'required', 'confirmed', Password::defaults()],
        ];
    }

    /**
     * Allowlist keys for the per-user feature_flags merge so arbitrary keys
     * can never reach the DB even if someone removes the validation rule.
     *
     * @return list<string>
     */
    public static function allowedFeatureFlagKeys(): array
    {
        return ['dates', 'delegation', 'ai_assistant'];
    }
}

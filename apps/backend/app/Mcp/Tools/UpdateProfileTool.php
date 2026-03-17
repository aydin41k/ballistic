<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use App\Mcp\Services\McpAuthContext;
use Generator;
use Illuminate\Support\Facades\Validator;
use Laravel\Mcp\Server\Tool;
use Laravel\Mcp\Server\Tools\Annotations\IsIdempotent;
use Laravel\Mcp\Server\Tools\ToolInputSchema;
use Laravel\Mcp\Server\Tools\ToolResult;

#[IsIdempotent]
final class UpdateProfileTool extends Tool
{
    public function __construct(
        private readonly McpAuthContext $auth,
    ) {}

    public function name(): string
    {
        return 'update_profile';
    }

    public function description(): string
    {
        return 'Update the authenticated user profile. Supports notes plus other profile fields like phone, bio, avatar URL, and display name.';
    }

    public function schema(ToolInputSchema $schema): ToolInputSchema
    {
        return $schema
            ->string('notes')
            ->description('Scratchpad/profile notes for the authenticated user')
            ->string('name')
            ->description('Display name for the authenticated user')
            ->string('phone')
            ->description('Phone number for the authenticated user')
            ->string('bio')
            ->description('Short bio for the authenticated user')
            ->string('avatar_url')
            ->description('Avatar image URL for the authenticated user');
    }

    public function handle(array $arguments): ToolResult|Generator
    {
        try {
            $user = $this->auth->user();

            $allowed = ['name', 'phone', 'notes', 'bio', 'avatar_url'];
            $updateData = array_intersect_key($arguments, array_flip($allowed));

            if ($updateData === []) {
                return ToolResult::error('Provide at least one profile field to update');
            }

            $validator = Validator::make($updateData, [
                'name' => ['sometimes', 'required', 'string', 'max:255'],
                'phone' => ['sometimes', 'nullable', 'string', 'max:20'],
                'notes' => ['sometimes', 'nullable', 'string', 'max:10000'],
                'bio' => ['sometimes', 'nullable', 'string', 'max:500'],
                'avatar_url' => ['sometimes', 'nullable', 'string', 'url', 'max:500'],
            ]);

            if ($validator->fails()) {
                return ToolResult::error('Profile validation failed: '.json_encode($validator->errors()->toArray(), JSON_THROW_ON_ERROR));
            }

            $validated = $validator->validated();
            $user->update($validated);
            $user->refresh();

            $this->auth->logAction('update_profile', 'user', (string) $user->id, 'success', [
                'fields' => array_keys($validated),
            ]);

            return ToolResult::json([
                'success' => true,
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'phone' => $user->phone,
                    'notes' => $user->notes,
                    'bio' => $user->bio,
                    'avatar_url' => $user->avatar_url,
                ],
            ]);
        } catch (\Throwable $e) {
            $this->auth->logAction('update_profile', 'user', (string) $this->auth->user()->id, 'error', [
                'error' => $e->getMessage(),
            ]);

            return ToolResult::error("Failed to update profile: {$e->getMessage()}");
        }
    }
}

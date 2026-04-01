<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use App\Mcp\Services\McpAuthContext;
use Generator;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Support\Facades\Validator;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Tool;
use Laravel\Mcp\Server\Tools\Annotations\IsIdempotent;

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

    public function schema(JsonSchema $schema): array
    {
        return [
            'notes' => $schema->string()
                ->description('Scratchpad or profile notes for the authenticated user.'),
            'name' => $schema->string()
                ->description('Display name for the authenticated user.'),
            'phone' => $schema->string()
                ->description('Phone number for the authenticated user.'),
            'bio' => $schema->string()
                ->description('Short bio for the authenticated user.'),
            'avatar_url' => $schema->string()
                ->description('Avatar image URL for the authenticated user.'),
        ];
    }

    public function handle(Request $request): Response|Generator
    {
        try {
            $arguments = $request->all();
            $user = $this->auth->user();

            $allowed = ['name', 'phone', 'notes', 'bio', 'avatar_url'];
            $updateData = array_intersect_key($arguments, array_flip($allowed));

            if ($updateData === []) {
                return Response::error('Provide at least one profile field to update');
            }

            $validator = Validator::make($updateData, [
                'name' => ['sometimes', 'required', 'string', 'max:255'],
                'phone' => ['sometimes', 'nullable', 'string', 'max:20'],
                'notes' => ['sometimes', 'nullable', 'string', 'max:10000'],
                'bio' => ['sometimes', 'nullable', 'string', 'max:500'],
                'avatar_url' => ['sometimes', 'nullable', 'string', 'url', 'max:500'],
            ]);

            if ($validator->fails()) {
                return Response::error('Profile validation failed: '.json_encode($validator->errors()->toArray(), JSON_THROW_ON_ERROR));
            }

            $validated = $validator->validated();
            $user->update($validated);
            $user->refresh();

            $this->auth->logAction('update_profile', 'user', (string) $user->id, 'success', [
                'fields' => array_keys($validated),
            ]);

            return Response::json([
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

            return Response::error("Failed to update profile: {$e->getMessage()}");
        }
    }
}

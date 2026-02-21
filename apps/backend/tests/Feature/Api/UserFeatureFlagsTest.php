<?php

declare(strict_types=1);

namespace Tests\Feature\Api;

use App\Auth\TokenAbility;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class UserFeatureFlagsTest extends TestCase
{
    use RefreshDatabase;

    public function test_partial_feature_flag_update_preserves_existing_keys(): void
    {
        $user = User::factory()->create([
            'feature_flags' => [
                'dates' => false,
                'delegation' => false,
                'ai_assistant' => true,
                'custom_flag' => true,
            ],
        ]);
        $token = $user->createToken('api-client', [TokenAbility::API])->plainTextToken;

        $response = $this->withToken($token)->patchJson('/api/user', [
            'feature_flags' => [
                'dates' => true,
            ],
        ]);

        $response->assertOk()
            ->assertJsonPath('data.feature_flags.dates', true)
            ->assertJsonPath('data.feature_flags.ai_assistant', true)
            ->assertJsonPath('data.feature_flags.custom_flag', true);

        $user->refresh();

        $this->assertSame([
            'dates' => true,
            'delegation' => false,
            'ai_assistant' => true,
            'custom_flag' => true,
        ], $user->feature_flags);
    }
}

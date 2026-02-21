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
            ],
        ]);
        $token = $user->createToken('api-client', [TokenAbility::Api->value])->plainTextToken;

        $response = $this->withToken($token)->patchJson('/api/user', [
            'feature_flags' => [
                'dates' => true,
            ],
        ]);

        $response->assertOk()
            ->assertJsonPath('data.feature_flags.dates', true)
            ->assertJsonPath('data.feature_flags.ai_assistant', true);

        $user->refresh();

        $this->assertSame([
            'dates' => true,
            'delegation' => false,
            'ai_assistant' => true,
        ], $user->feature_flags);
    }

    public function test_arbitrary_feature_flag_keys_are_not_persisted_from_request(): void
    {
        $user = User::factory()->create([
            'feature_flags' => [
                'dates' => false,
                'delegation' => false,
                'ai_assistant' => false,
            ],
        ]);
        $token = $user->createToken('api-client', [TokenAbility::Api->value])->plainTextToken;

        $this->withToken($token)->patchJson('/api/user', [
            'feature_flags' => [
                'dates' => true,
                'malicious_flag' => true,
            ],
        ])->assertOk();

        $user->refresh();

        $this->assertSame([
            'dates' => true,
            'delegation' => false,
            'ai_assistant' => false,
        ], $user->feature_flags);
        $this->assertArrayNotHasKey('malicious_flag', $user->feature_flags);
    }
}

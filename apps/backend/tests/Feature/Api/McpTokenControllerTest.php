<?php

declare(strict_types=1);

namespace Tests\Feature\Api;

use App\Auth\TokenAbility;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\PersonalAccessToken;
use Tests\TestCase;

final class McpTokenControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_with_ai_feature_can_list_mcp_tokens(): void
    {
        config()->set('mcp.legacy_wildcard_cutoff_at', now()->addDay()->toIso8601String());

        $user = User::factory()->create([
            'feature_flags' => ['ai_assistant' => true],
        ]);
        $apiToken = $user->createToken('api-client', [TokenAbility::Api->value])->plainTextToken;

        $user->createToken('mcp-client', [TokenAbility::Mcp->value]);
        $user->createToken('legacy-client'); // wildcard
        $user->createToken('mobile-client', [TokenAbility::Api->value]);

        $response = $this->withToken($apiToken)->getJson('/api/mcp/tokens');

        $response->assertOk();
        $response->assertJsonCount(2, 'data');
        $response->assertJsonFragment(['name' => 'mcp-client']);
        $response->assertJsonFragment(['name' => 'legacy-client']);
    }

    public function test_legacy_wildcard_tokens_are_hidden_after_cutoff(): void
    {
        config()->set('mcp.legacy_wildcard_cutoff_at', now()->subDay()->toIso8601String());

        $user = User::factory()->create([
            'feature_flags' => ['ai_assistant' => true],
        ]);
        $apiToken = $user->createToken('api-client', [TokenAbility::Api->value])->plainTextToken;

        $user->createToken('mcp-client', [TokenAbility::Mcp->value]);
        $user->createToken('legacy-client'); // wildcard

        $response = $this->withToken($apiToken)->getJson('/api/mcp/tokens');

        $response->assertOk();
        $response->assertJsonCount(1, 'data');
        $response->assertJsonFragment(['name' => 'mcp-client']);
    }

    public function test_user_can_create_mcp_token_via_api(): void
    {
        $user = User::factory()->create([
            'feature_flags' => ['ai_assistant' => true],
        ]);
        $apiToken = $user->createToken('api-client', [TokenAbility::Api->value])->plainTextToken;

        $response = $this->withToken($apiToken)->postJson('/api/mcp/tokens', [
            'name' => 'Claude Desktop',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'data' => [
                    'token',
                    'token_record' => ['id', 'name', 'created_at', 'last_used_at', 'is_legacy_wildcard'],
                ],
            ]);

        $accessToken = PersonalAccessToken::findToken($response->json('data.token'));
        $this->assertNotNull($accessToken);
        $this->assertTrue($accessToken->can(TokenAbility::Mcp->value));
    }

    public function test_create_mcp_token_requires_name(): void
    {
        $user = User::factory()->create([
            'feature_flags' => ['ai_assistant' => true],
        ]);
        $apiToken = $user->createToken('api-client', [TokenAbility::Api->value])->plainTextToken;

        $this->withToken($apiToken)
            ->postJson('/api/mcp/tokens', [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['name']);
    }

    public function test_user_can_revoke_only_mcp_relevant_tokens(): void
    {
        config()->set('mcp.legacy_wildcard_cutoff_at', now()->addDay()->toIso8601String());

        $user = User::factory()->create([
            'feature_flags' => ['ai_assistant' => true],
        ]);
        $apiToken = $user->createToken('api-client', [TokenAbility::Api->value])->plainTextToken;
        $mcpToken = $user->createToken('mcp-client', [TokenAbility::Mcp->value])->accessToken;
        $mobileToken = $user->createToken('mobile-client', [TokenAbility::Api->value])->accessToken;

        $this->withToken($apiToken)
            ->deleteJson('/api/mcp/tokens/'.$mcpToken->id)
            ->assertOk();

        $this->assertDatabaseMissing('personal_access_tokens', [
            'id' => $mcpToken->id,
        ]);

        $this->withToken($apiToken)
            ->deleteJson('/api/mcp/tokens/'.$mobileToken->id)
            ->assertStatus(404);

        $this->assertDatabaseHas('personal_access_tokens', [
            'id' => $mobileToken->id,
        ]);
    }

    public function test_mcp_token_api_requires_ai_feature_flag(): void
    {
        $user = User::factory()->create([
            'feature_flags' => ['ai_assistant' => false],
        ]);
        $apiToken = $user->createToken('api-client', [TokenAbility::Api->value])->plainTextToken;

        $this->withToken($apiToken)->getJson('/api/mcp/tokens')->assertStatus(404);
    }

    public function test_mcp_token_api_rejects_mcp_scoped_tokens(): void
    {
        $user = User::factory()->create([
            'feature_flags' => ['ai_assistant' => true],
        ]);
        $mcpToken = $user->createToken('mcp-client', [TokenAbility::Mcp->value])->plainTextToken;

        $this->withToken($mcpToken)
            ->getJson('/api/mcp/tokens')
            ->assertStatus(403)
            ->assertJson([
                'message' => 'Token missing API scope.',
            ]);
    }
}

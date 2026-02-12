<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Connection;
use App\Models\Item;
use App\Models\Project;
use App\Models\Tag;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Integration tests for the Ballistic MCP server using Laravel Boost patterns.
 *
 * These tests verify the MCP server integrates correctly with Laravel's
 * service container, authentication, and database using HTTP transport.
 *
 * Based on Laravel Boost testing practices for MCP servers.
 */
final class McpBoostIntegrationTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private string $token;

    protected function setUp(): void
    {
        parent::setUp();

        // Create user with AI assistant feature enabled
        $this->user = User::factory()->create([
            'feature_flags' => ['ai_assistant' => true],
        ]);
        $this->token = $this->user->createToken('boost-test')->plainTextToken;
    }

    /**
     * Helper to make MCP JSON-RPC requests.
     */
    private function mcpRequest(string $method, array $params = [], ?int $id = null): array
    {
        $response = $this->withToken($this->token)->postJson('/mcp', [
            'jsonrpc' => '2.0',
            'id' => $id ?? rand(1, 10000),
            'method' => $method,
            'params' => $params,
        ]);

        return $response->json();
    }

    /**
     * Helper to call an MCP tool.
     */
    private function callTool(string $name, array $arguments = []): array
    {
        return $this->mcpRequest('tools/call', [
            'name' => $name,
            'arguments' => $arguments,
        ]);
    }

    /**
     * Helper to read an MCP resource.
     */
    private function readResource(string $uri): array
    {
        return $this->mcpRequest('resources/read', ['uri' => $uri]);
    }

    // ========================================================================
    // SERVER INITIALIZATION TESTS (Boost Pattern)
    // ========================================================================

    public function test_server_info_matches_boost_expectations(): void
    {
        $data = $this->mcpRequest('initialize', [
            'protocolVersion' => '2025-03-26',
            'capabilities' => [],
            'clientInfo' => ['name' => 'laravel-boost-test', 'version' => '1.0.0'],
        ]);

        $this->assertArrayHasKey('result', $data);
        $this->assertArrayHasKey('serverInfo', $data['result']);
        $this->assertEquals('Ballistic Social', $data['result']['serverInfo']['name']);
        $this->assertArrayHasKey('capabilities', $data['result']);
    }

    public function test_server_supports_required_capabilities(): void
    {
        $data = $this->mcpRequest('initialize', [
            'protocolVersion' => '2025-03-26',
            'capabilities' => [],
            'clientInfo' => ['name' => 'boost-capabilities-test', 'version' => '1.0.0'],
        ]);

        $capabilities = $data['result']['capabilities'];

        // Verify essential capabilities for AI agent integration
        $this->assertArrayHasKey('tools', $capabilities);
        $this->assertArrayHasKey('resources', $capabilities);
    }

    // ========================================================================
    // TOOLS LIST TESTS (Boost Verification Pattern)
    // ========================================================================

    public function test_tools_list_contains_required_ballistic_tools(): void
    {
        $data = $this->mcpRequest('tools/list');

        $this->assertArrayHasKey('result', $data);
        $this->assertArrayHasKey('tools', $data['result']);

        $toolNames = array_column($data['result']['tools'], 'name');

        // Verify core CRUD tools exist (Boost expects these for app integration)
        $requiredTools = [
            'create_item',
            'update_item',
            'complete_item',
            'delete_item',
            'search_items',
            'create_project',
            'update_project',
            'create_tag',
            'assign_item',
            'lookup_users',
        ];

        foreach ($requiredTools as $tool) {
            $this->assertContains($tool, $toolNames, "Required tool '{$tool}' must be available");
        }
    }

    public function test_tool_schemas_are_valid_json_schema(): void
    {
        $data = $this->mcpRequest('tools/list');

        foreach ($data['result']['tools'] as $tool) {
            $this->assertArrayHasKey('inputSchema', $tool, "Tool '{$tool['name']}' must have inputSchema");
            $this->assertEquals('object', $tool['inputSchema']['type'] ?? null, "Tool '{$tool['name']}' schema type must be object");
            $this->assertArrayHasKey('properties', $tool['inputSchema'], "Tool '{$tool['name']}' must define properties");
        }
    }

    // ========================================================================
    // RESOURCES LIST TESTS (Boost Verification Pattern)
    // ========================================================================

    public function test_resources_list_contains_required_ballistic_resources(): void
    {
        $data = $this->mcpRequest('resources/list');

        $this->assertArrayHasKey('result', $data);
        $this->assertArrayHasKey('resources', $data['result']);

        $resourceUris = array_column($data['result']['resources'], 'uri');

        // Verify core resources exist
        $requiredResources = [
            'ballistic://users/me',
            'ballistic://items',
            'ballistic://projects',
            'ballistic://tags',
            'ballistic://connections',
        ];

        foreach ($requiredResources as $uri) {
            $this->assertContains($uri, $resourceUris, "Required resource '{$uri}' must be available");
        }
    }

    // ========================================================================
    // TOOL EXECUTION TESTS (Boost Database Integration Pattern)
    // ========================================================================

    public function test_create_item_tool_persists_to_database(): void
    {
        $data = $this->callTool('create_item', [
            'title' => 'Boost Database Integration Test',
            'description' => 'Created via Laravel Boost integration pattern',
        ]);

        $this->assertFalse($data['result']['isError'] ?? true);

        $this->assertDatabaseHas('items', [
            'title' => 'Boost Database Integration Test',
            'user_id' => $this->user->id,
        ]);
    }

    public function test_search_items_respects_user_scope(): void
    {
        // Create items for authenticated user
        Item::factory()->count(3)->create(['user_id' => $this->user->id]);

        // Create items for another user (should be excluded)
        $otherUser = User::factory()->create();
        Item::factory()->count(5)->create(['user_id' => $otherUser->id]);

        $data = $this->callTool('search_items', []);

        $this->assertFalse($data['result']['isError'] ?? true);

        $content = json_decode($data['result']['content'][0]['text'], true);
        $this->assertEquals(3, $content['count'], 'Search must respect user scoping');
    }

    public function test_create_project_validates_colour_format(): void
    {
        // Valid colour
        $validData = $this->callTool('create_project', [
            'name' => 'Valid Project',
            'color' => '#FF5733',
        ]);
        $this->assertFalse($validData['result']['isError'] ?? true);

        // Invalid colour
        $invalidData = $this->callTool('create_project', [
            'name' => 'Invalid Project',
            'color' => 'not-a-colour',
        ]);
        $this->assertTrue($invalidData['result']['isError'] ?? false);
    }

    public function test_create_tag_is_idempotent(): void
    {
        $existingTag = Tag::factory()->create([
            'user_id' => $this->user->id,
            'name' => 'Idempotent Tag',
        ]);

        $data = $this->callTool('create_tag', ['name' => 'Idempotent Tag']);

        $this->assertFalse($data['result']['isError'] ?? true);

        $content = json_decode($data['result']['content'][0]['text'], true);
        $this->assertEquals((string) $existingTag->id, $content['tag']['id']);

        // Verify no duplicate was created
        $this->assertEquals(1, Tag::where('user_id', $this->user->id)->where('name', 'Idempotent Tag')->count());
    }

    public function test_lookup_users_returns_only_connected_users(): void
    {
        $connectedUser = User::factory()->create(['name' => 'Connected Friend']);
        $unconnectedUser = User::factory()->create(['name' => 'Stranger']);

        Connection::create([
            'requester_id' => $this->user->id,
            'addressee_id' => $connectedUser->id,
            'status' => 'accepted',
        ]);

        $data = $this->callTool('lookup_users', []);

        $content = json_decode($data['result']['content'][0]['text'], true);

        $userNames = array_column($content['users'], 'name');
        $this->assertContains('Connected Friend', $userNames);
        $this->assertNotContains('Stranger', $userNames);
    }

    public function test_assign_item_requires_connection(): void
    {
        $item = Item::factory()->create(['user_id' => $this->user->id]);
        $unconnectedUser = User::factory()->create();

        $data = $this->callTool('assign_item', [
            'item_id' => (string) $item->id,
            'assignee_id' => (string) $unconnectedUser->id,
        ]);

        $this->assertTrue($data['result']['isError'] ?? false);
        $this->assertStringContainsString('connection', strtolower($data['result']['content'][0]['text']));
    }

    // ========================================================================
    // RESOURCE READING TESTS (Boost Database Integration Pattern)
    // ========================================================================

    public function test_user_profile_resource_returns_correct_counts(): void
    {
        Item::factory()->count(5)->create(['user_id' => $this->user->id]);
        Project::factory()->count(3)->create(['user_id' => $this->user->id]);
        Tag::factory()->count(2)->create(['user_id' => $this->user->id]);

        $data = $this->readResource('ballistic://users/me');

        $content = json_decode($data['result']['contents'][0]['text'], true);

        $this->assertEquals($this->user->email, $content['email']);
        $this->assertEquals(5, $content['counts']['items']);
        $this->assertEquals(3, $content['counts']['projects']);
        $this->assertEquals(2, $content['counts']['tags']);
    }

    public function test_items_resource_respects_user_scope(): void
    {
        Item::factory()->count(4)->create(['user_id' => $this->user->id]);

        $otherUser = User::factory()->create();
        Item::factory()->count(10)->create(['user_id' => $otherUser->id]);

        $data = $this->readResource('ballistic://items');

        $content = json_decode($data['result']['contents'][0]['text'], true);

        $this->assertCount(4, $content['items']);
    }

    public function test_projects_resource_separates_active_and_archived(): void
    {
        Project::factory()->count(2)->create([
            'user_id' => $this->user->id,
            'archived_at' => null,
        ]);
        Project::factory()->create([
            'user_id' => $this->user->id,
            'archived_at' => now(),
        ]);

        $data = $this->readResource('ballistic://projects');

        $content = json_decode($data['result']['contents'][0]['text'], true);

        $this->assertCount(2, $content['active']['projects']);
        $this->assertCount(1, $content['archived']['projects']);
    }

    // ========================================================================
    // SECURITY TESTS (Boost Security Pattern)
    // ========================================================================

    public function test_unauthenticated_requests_are_rejected(): void
    {
        $response = $this->postJson('/mcp', [
            'jsonrpc' => '2.0',
            'id' => 1,
            'method' => 'tools/list',
            'params' => [],
        ]);

        // Should redirect to login or return unauthorized
        $this->assertTrue(in_array($response->status(), [302, 401, 403]));
    }

    public function test_cross_user_item_access_is_blocked(): void
    {
        $otherUser = User::factory()->create();
        $otherItem = Item::factory()->create(['user_id' => $otherUser->id]);

        $data = $this->callTool('update_item', [
            'id' => (string) $otherItem->id,
            'title' => 'Attempted Hijack',
        ]);

        $this->assertTrue($data['result']['isError'] ?? false);
        $this->assertStringContainsString('not found', strtolower($data['result']['content'][0]['text']));
    }

    public function test_assignee_cannot_delete_items(): void
    {
        $owner = User::factory()->create();
        $item = Item::factory()->create([
            'user_id' => $owner->id,
            'assignee_id' => $this->user->id,
        ]);

        $data = $this->callTool('delete_item', ['id' => (string) $item->id]);

        $this->assertTrue($data['result']['isError'] ?? false);
    }

    // ========================================================================
    // PERFORMANCE TESTS (Boost Performance Pattern)
    // ========================================================================

    public function test_initialization_completes_within_benchmark(): void
    {
        $start = microtime(true);

        $this->mcpRequest('initialize', [
            'protocolVersion' => '2025-03-26',
            'capabilities' => [],
            'clientInfo' => ['name' => 'perf-test', 'version' => '1.0.0'],
        ]);

        $duration = (microtime(true) - $start) * 1000;

        $this->assertLessThan(100, $duration, "Initialization should complete in under 100ms (took {$duration}ms)");
    }
}

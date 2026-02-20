<?php

declare(strict_types=1);

namespace Tests\Unit\Mcp;

use App\Mcp\Resources\ConnectionsResource;
use App\Mcp\Resources\ItemsResource;
use App\Mcp\Resources\ProjectsResource;
use App\Mcp\Resources\TagsResource;
use App\Mcp\Resources\UserProfileResource;
use App\Mcp\Services\McpAuthContext;
use App\Models\Connection;
use App\Models\Item;
use App\Models\Project;
use App\Models\Tag;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Unit tests for MCP Resources following Laravel MCP testing patterns.
 *
 * These tests directly instantiate and test the resource classes
 * to verify their read() methods return correct content.
 */
final class McpResourcesTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private McpAuthContext $auth;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $this->auth = new McpAuthContext;
        $this->auth->setUser($this->user);
    }

    // ========================================================================
    // USER PROFILE RESOURCE TESTS
    // ========================================================================

    public function test_user_profile_resource_returns_user_data(): void
    {
        $resource = new UserProfileResource($this->auth);

        $content = $resource->read();

        $data = json_decode($content, true);

        $this->assertEquals((string) $this->user->id, $data['id']);
        $this->assertEquals($this->user->name, $data['name']);
        $this->assertEquals($this->user->email, $data['email']);
        $this->assertArrayHasKey('counts', $data);
    }

    public function test_user_profile_resource_includes_counts(): void
    {
        // Create some data for the user
        Item::factory()->count(3)->create(['user_id' => $this->user->id]);
        Project::factory()->count(2)->create(['user_id' => $this->user->id]);
        Tag::factory()->count(4)->create(['user_id' => $this->user->id]);

        $resource = new UserProfileResource($this->auth);

        $content = $resource->read();
        $data = json_decode($content, true);

        $this->assertEquals(3, $data['counts']['items']);
        $this->assertEquals(2, $data['counts']['projects']);
        $this->assertEquals(4, $data['counts']['tags']);
    }

    public function test_user_profile_resource_has_correct_uri(): void
    {
        $resource = new UserProfileResource($this->auth);

        $this->assertEquals('ballistic://users/me', $resource->uri());
    }

    public function test_user_profile_resource_has_correct_mime_type(): void
    {
        $resource = new UserProfileResource($this->auth);

        $this->assertEquals('application/json', $resource->mimeType());
    }

    // ========================================================================
    // ITEMS RESOURCE TESTS
    // ========================================================================

    public function test_items_resource_returns_user_items(): void
    {
        Item::factory()->count(3)->create(['user_id' => $this->user->id]);
        Item::factory()->count(2)->create(); // Other user's items

        $resource = new ItemsResource($this->auth);

        $content = $resource->read();
        $data = json_decode($content, true);

        $this->assertCount(3, $data['items']);
    }

    public function test_items_resource_includes_assigned_items(): void
    {
        $owner = User::factory()->create();
        Item::factory()->create(['user_id' => $this->user->id]);
        Item::factory()->create([
            'user_id' => $owner->id,
            'assignee_id' => $this->user->id,
        ]);

        $resource = new ItemsResource($this->auth);

        $content = $resource->read();
        $data = json_decode($content, true);

        $this->assertCount(2, $data['items']);
    }

    public function test_items_resource_has_correct_uri(): void
    {
        $resource = new ItemsResource($this->auth);

        $this->assertEquals('ballistic://items', $resource->uri());
    }

    public function test_items_resource_item_structure(): void
    {
        $project = Project::factory()->create(['user_id' => $this->user->id]);
        $tag = Tag::factory()->create(['user_id' => $this->user->id]);
        $item = Item::factory()->create([
            'user_id' => $this->user->id,
            'project_id' => $project->id,
        ]);
        // Use sync to avoid potential duplicate issues
        $item->tags()->sync([(string) $tag->id]);

        $resource = new ItemsResource($this->auth);

        $content = $resource->read();
        $data = json_decode($content, true);

        $itemData = $data['items'][0];

        $this->assertArrayHasKey('id', $itemData);
        $this->assertArrayHasKey('title', $itemData);
        $this->assertArrayHasKey('status', $itemData);
        $this->assertArrayHasKey('project_id', $itemData);
        $this->assertArrayHasKey('tags', $itemData);
    }

    // ========================================================================
    // PROJECTS RESOURCE TESTS
    // ========================================================================

    public function test_projects_resource_returns_user_projects(): void
    {
        Project::factory()->count(3)->create(['user_id' => $this->user->id]);
        Project::factory()->count(2)->create(); // Other user's projects

        $resource = new ProjectsResource($this->auth);

        $content = $resource->read();
        $data = json_decode($content, true);

        // Resource returns active/archived structure
        $this->assertCount(3, $data['active']['projects']);
    }

    public function test_projects_resource_separates_archived(): void
    {
        Project::factory()->count(2)->create([
            'user_id' => $this->user->id,
            'archived_at' => null,
        ]);
        Project::factory()->create([
            'user_id' => $this->user->id,
            'archived_at' => now(),
        ]);

        $resource = new ProjectsResource($this->auth);

        $content = $resource->read();
        $data = json_decode($content, true);

        $this->assertCount(2, $data['active']['projects']);
        $this->assertCount(1, $data['archived']['projects']);
    }

    public function test_projects_resource_has_correct_uri(): void
    {
        $resource = new ProjectsResource($this->auth);

        $this->assertEquals('ballistic://projects', $resource->uri());
    }

    public function test_projects_resource_includes_item_counts(): void
    {
        $project = Project::factory()->create(['user_id' => $this->user->id]);
        Item::factory()->count(5)->create([
            'user_id' => $this->user->id,
            'project_id' => $project->id,
        ]);

        $resource = new ProjectsResource($this->auth);

        $content = $resource->read();
        $data = json_decode($content, true);

        $this->assertEquals(5, $data['active']['projects'][0]['items_count']);
    }

    // ========================================================================
    // TAGS RESOURCE TESTS
    // ========================================================================

    public function test_tags_resource_returns_user_tags(): void
    {
        Tag::factory()->count(3)->create(['user_id' => $this->user->id]);
        Tag::factory()->count(2)->create(); // Other user's tags

        $resource = new TagsResource($this->auth);

        $content = $resource->read();
        $data = json_decode($content, true);

        $this->assertCount(3, $data['tags']);
    }

    public function test_tags_resource_has_correct_uri(): void
    {
        $resource = new TagsResource($this->auth);

        $this->assertEquals('ballistic://tags', $resource->uri());
    }

    public function test_tags_resource_includes_usage_counts(): void
    {
        $tag = Tag::factory()->create(['user_id' => $this->user->id]);
        $items = Item::factory()->count(3)->create(['user_id' => $this->user->id]);

        foreach ($items as $item) {
            // Use sync to avoid potential duplicate issues
            $item->tags()->sync([(string) $tag->id]);
        }

        $resource = new TagsResource($this->auth);

        $content = $resource->read();
        $data = json_decode($content, true);

        $this->assertEquals(3, $data['tags'][0]['items_count']);
    }

    // ========================================================================
    // CONNECTIONS RESOURCE TESTS
    // ========================================================================

    public function test_connections_resource_returns_connected_users(): void
    {
        $connectedUser1 = User::factory()->create();
        $connectedUser2 = User::factory()->create();

        Connection::create([
            'requester_id' => $this->user->id,
            'addressee_id' => $connectedUser1->id,
            'status' => 'accepted',
        ]);
        Connection::create([
            'requester_id' => $connectedUser2->id,
            'addressee_id' => $this->user->id,
            'status' => 'accepted',
        ]);

        $resource = new ConnectionsResource($this->auth);

        $content = $resource->read();
        $data = json_decode($content, true);

        $this->assertCount(2, $data['connections']);
    }

    public function test_connections_resource_excludes_pending_connections(): void
    {
        $pendingUser = User::factory()->create();
        $acceptedUser = User::factory()->create();

        Connection::create([
            'requester_id' => $this->user->id,
            'addressee_id' => $pendingUser->id,
            'status' => 'pending',
        ]);
        Connection::create([
            'requester_id' => $this->user->id,
            'addressee_id' => $acceptedUser->id,
            'status' => 'accepted',
        ]);

        $resource = new ConnectionsResource($this->auth);

        $content = $resource->read();
        $data = json_decode($content, true);

        $this->assertCount(1, $data['connections']);
        $this->assertEquals((string) $acceptedUser->id, $data['connections'][0]['id']);
    }

    public function test_connections_resource_has_correct_uri(): void
    {
        $resource = new ConnectionsResource($this->auth);

        $this->assertEquals('ballistic://connections', $resource->uri());
    }

    public function test_connections_resource_returns_empty_when_no_connections(): void
    {
        $resource = new ConnectionsResource($this->auth);

        $content = $resource->read();
        $data = json_decode($content, true);

        $this->assertCount(0, $data['connections']);
    }
}

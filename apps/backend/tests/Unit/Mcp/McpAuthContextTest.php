<?php

declare(strict_types=1);

namespace Tests\Unit\Mcp;

use App\Mcp\Services\McpAuthContext;
use App\Models\Connection;
use App\Models\Item;
use App\Models\Project;
use App\Models\Tag;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Unit tests for McpAuthContext service.
 *
 * Tests the context-aware guard that enforces user scoping
 * and authorization policies for MCP operations.
 */
final class McpAuthContextTest extends TestCase
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
    // USER CONTEXT TESTS
    // ========================================================================

    public function test_user_returns_set_user(): void
    {
        $this->assertEquals($this->user->id, $this->auth->user()->id);
    }

    public function test_user_throws_exception_when_not_set(): void
    {
        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('MCP operation requires authenticated user');

        $auth = new McpAuthContext;
        $auth->user();
    }

    public function test_is_authenticated_returns_true_when_user_set(): void
    {
        $this->assertTrue($this->auth->isAuthenticated());
    }

    public function test_is_authenticated_returns_false_when_user_not_set(): void
    {
        $auth = new McpAuthContext;
        $this->assertFalse($auth->isAuthenticated());
    }

    // ========================================================================
    // ITEM SCOPING TESTS
    // ========================================================================

    public function test_get_item_returns_owned_item(): void
    {
        $item = Item::factory()->create(['user_id' => $this->user->id]);

        $result = $this->auth->getItem((string) $item->id);

        $this->assertNotNull($result);
        $this->assertEquals($item->id, $result->id);
    }

    public function test_get_item_returns_assigned_item(): void
    {
        $owner = User::factory()->create();
        $item = Item::factory()->create([
            'user_id' => $owner->id,
            'assignee_id' => $this->user->id,
        ]);

        $result = $this->auth->getItem((string) $item->id);

        $this->assertNotNull($result);
        $this->assertEquals($item->id, $result->id);
    }

    public function test_get_item_returns_null_for_other_users_item(): void
    {
        $otherUser = User::factory()->create();
        $item = Item::factory()->create(['user_id' => $otherUser->id]);

        $result = $this->auth->getItem((string) $item->id);

        $this->assertNull($result);
    }

    public function test_get_items_returns_only_user_items(): void
    {
        Item::factory()->count(3)->create(['user_id' => $this->user->id]);
        Item::factory()->count(2)->create(); // Other user's items

        $items = $this->auth->getItems();

        $this->assertCount(3, $items);
    }

    public function test_get_items_filters_by_status(): void
    {
        Item::factory()->count(2)->create(['user_id' => $this->user->id, 'status' => 'todo']);
        Item::factory()->create(['user_id' => $this->user->id, 'status' => 'done']);

        $items = $this->auth->getItems(['status' => 'todo']);

        $this->assertCount(2, $items);
    }

    public function test_get_items_filters_by_project(): void
    {
        $project = Project::factory()->create(['user_id' => $this->user->id]);
        Item::factory()->count(2)->create(['user_id' => $this->user->id, 'project_id' => $project->id]);
        Item::factory()->create(['user_id' => $this->user->id, 'project_id' => null]);

        $items = $this->auth->getItems(['project_id' => (string) $project->id]);

        $this->assertCount(2, $items);
    }

    public function test_get_items_filters_inbox(): void
    {
        $project = Project::factory()->create(['user_id' => $this->user->id]);
        Item::factory()->create(['user_id' => $this->user->id, 'project_id' => $project->id]);
        Item::factory()->count(2)->create(['user_id' => $this->user->id, 'project_id' => null]);

        $items = $this->auth->getItems(['project_id' => 'inbox']);

        $this->assertCount(2, $items);
    }

    public function test_get_items_filters_assigned_to_me(): void
    {
        $owner = User::factory()->create();
        Item::factory()->create(['user_id' => $this->user->id]); // Own item
        Item::factory()->create([
            'user_id' => $owner->id,
            'assignee_id' => $this->user->id,
        ]); // Assigned to me

        $items = $this->auth->getItems(['assigned_to_me' => true]);

        $this->assertCount(1, $items);
        $this->assertEquals($owner->id, $items->first()->user_id);
    }

    public function test_get_items_filters_delegated(): void
    {
        $assignee = User::factory()->create();
        Item::factory()->create(['user_id' => $this->user->id, 'assignee_id' => null]); // Not delegated
        Item::factory()->create([
            'user_id' => $this->user->id,
            'assignee_id' => $assignee->id,
        ]); // Delegated

        $items = $this->auth->getItems(['delegated' => true]);

        $this->assertCount(1, $items);
        $this->assertEquals($assignee->id, $items->first()->assignee_id);
    }

    public function test_get_items_search_is_case_insensitive(): void
    {
        Item::factory()->create(['user_id' => $this->user->id, 'title' => 'Buy GROCERIES']);
        Item::factory()->create(['user_id' => $this->user->id, 'title' => 'Call dentist']);

        $items = $this->auth->getItems(['search' => 'groceries']);

        $this->assertCount(1, $items);
    }

    public function test_get_items_search_escapes_like_wildcards(): void
    {
        Item::factory()->create(['user_id' => $this->user->id, 'title' => 'Task with 50% progress']);
        Item::factory()->create(['user_id' => $this->user->id, 'title' => 'Another task']);
        Item::factory()->create(['user_id' => $this->user->id, 'title' => 'Use file_name convention']);

        // Search for literal % should only match items containing %
        $items = $this->auth->getItems(['search' => '50%']);
        $this->assertCount(1, $items);
        $this->assertStringContainsString('50%', $items->first()->title);

        // Search for literal _ should only match items containing _
        $items = $this->auth->getItems(['search' => 'file_name']);
        $this->assertCount(1, $items);
        $this->assertStringContainsString('file_name', $items->first()->title);

        // Verify that % alone doesn't match items without % in title
        $items = $this->auth->getItems(['search' => 'nonexistent%pattern']);
        $this->assertCount(0, $items);
    }

    public function test_get_items_respects_limit(): void
    {
        Item::factory()->count(10)->create(['user_id' => $this->user->id]);

        $items = $this->auth->getItems(['limit' => 3]);

        $this->assertCount(3, $items);
    }

    public function test_get_items_limit_capped_at_100(): void
    {
        Item::factory()->count(5)->create(['user_id' => $this->user->id]);

        $items = $this->auth->getItems(['limit' => 200]);

        // Should still work, limit capped at 100
        $this->assertCount(5, $items);
    }

    // ========================================================================
    // PROJECT SCOPING TESTS
    // ========================================================================

    public function test_get_project_returns_owned_project(): void
    {
        $project = Project::factory()->create(['user_id' => $this->user->id]);

        $result = $this->auth->getProject((string) $project->id);

        $this->assertNotNull($result);
        $this->assertEquals($project->id, $result->id);
    }

    public function test_get_project_returns_null_for_other_users_project(): void
    {
        $otherUser = User::factory()->create();
        $project = Project::factory()->create(['user_id' => $otherUser->id]);

        $result = $this->auth->getProject((string) $project->id);

        $this->assertNull($result);
    }

    public function test_get_projects_returns_only_user_projects(): void
    {
        Project::factory()->count(3)->create(['user_id' => $this->user->id]);
        Project::factory()->count(2)->create(); // Other user's projects

        $projects = $this->auth->getProjects();

        $this->assertCount(3, $projects);
    }

    public function test_get_projects_excludes_archived_by_default(): void
    {
        Project::factory()->count(2)->create(['user_id' => $this->user->id, 'archived_at' => null]);
        Project::factory()->create(['user_id' => $this->user->id, 'archived_at' => now()]);

        $projects = $this->auth->getProjects();

        $this->assertCount(2, $projects);
    }

    public function test_get_projects_includes_archived_when_requested(): void
    {
        Project::factory()->count(2)->create(['user_id' => $this->user->id, 'archived_at' => null]);
        Project::factory()->create(['user_id' => $this->user->id, 'archived_at' => now()]);

        $projects = $this->auth->getProjects(includeArchived: true);

        $this->assertCount(3, $projects);
    }

    // ========================================================================
    // TAG SCOPING TESTS
    // ========================================================================

    public function test_get_tag_returns_owned_tag(): void
    {
        $tag = Tag::factory()->create(['user_id' => $this->user->id]);

        $result = $this->auth->getTag((string) $tag->id);

        $this->assertNotNull($result);
        $this->assertEquals($tag->id, $result->id);
    }

    public function test_get_tag_returns_null_for_other_users_tag(): void
    {
        $otherUser = User::factory()->create();
        $tag = Tag::factory()->create(['user_id' => $otherUser->id]);

        $result = $this->auth->getTag((string) $tag->id);

        $this->assertNull($result);
    }

    public function test_get_tags_returns_only_user_tags(): void
    {
        Tag::factory()->count(3)->create(['user_id' => $this->user->id]);
        Tag::factory()->count(2)->create(); // Other user's tags

        $tags = $this->auth->getTags();

        $this->assertCount(3, $tags);
    }

    // ========================================================================
    // CONNECTION TESTS
    // ========================================================================

    public function test_can_assign_to_connected_user(): void
    {
        $connectedUser = User::factory()->create();
        Connection::create([
            'requester_id' => $this->user->id,
            'addressee_id' => $connectedUser->id,
            'status' => 'accepted',
        ]);

        $this->assertTrue($this->auth->canAssignTo((string) $connectedUser->id));
    }

    public function test_cannot_assign_to_unconnected_user(): void
    {
        $unconnectedUser = User::factory()->create();

        $this->assertFalse($this->auth->canAssignTo((string) $unconnectedUser->id));
    }

    public function test_cannot_assign_to_pending_connection(): void
    {
        $pendingUser = User::factory()->create();
        Connection::create([
            'requester_id' => $this->user->id,
            'addressee_id' => $pendingUser->id,
            'status' => 'pending',
        ]);

        $this->assertFalse($this->auth->canAssignTo((string) $pendingUser->id));
    }

    public function test_get_connected_users_returns_accepted_connections(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        $user3 = User::factory()->create();

        Connection::create([
            'requester_id' => $this->user->id,
            'addressee_id' => $user1->id,
            'status' => 'accepted',
        ]);
        Connection::create([
            'requester_id' => $user2->id,
            'addressee_id' => $this->user->id,
            'status' => 'accepted',
        ]);
        Connection::create([
            'requester_id' => $this->user->id,
            'addressee_id' => $user3->id,
            'status' => 'pending',
        ]);

        $connections = $this->auth->getConnectedUsers();

        $this->assertCount(2, $connections);
    }

    // ========================================================================
    // ITEM PERMISSION TESTS
    // ========================================================================

    public function test_is_item_owner_returns_true_for_owner(): void
    {
        $item = Item::factory()->create(['user_id' => $this->user->id]);

        $this->assertTrue($this->auth->isItemOwner($item));
    }

    public function test_is_item_owner_returns_false_for_assignee(): void
    {
        $owner = User::factory()->create();
        $item = Item::factory()->create([
            'user_id' => $owner->id,
            'assignee_id' => $this->user->id,
        ]);

        $this->assertFalse($this->auth->isItemOwner($item));
    }

    public function test_can_view_item_as_owner(): void
    {
        $item = Item::factory()->create(['user_id' => $this->user->id]);

        $this->assertTrue($this->auth->canViewItem($item));
    }

    public function test_can_view_item_as_assignee(): void
    {
        $owner = User::factory()->create();
        $item = Item::factory()->create([
            'user_id' => $owner->id,
            'assignee_id' => $this->user->id,
        ]);

        $this->assertTrue($this->auth->canViewItem($item));
    }

    public function test_cannot_view_other_users_item(): void
    {
        $otherUser = User::factory()->create();
        $item = Item::factory()->create(['user_id' => $otherUser->id]);

        $this->assertFalse($this->auth->canViewItem($item));
    }

    public function test_owner_can_update_any_field(): void
    {
        $item = Item::factory()->create(['user_id' => $this->user->id]);

        $this->assertTrue($this->auth->canUpdateItemFields($item, ['title', 'description', 'status', 'project_id']));
    }

    public function test_assignee_can_update_allowed_fields(): void
    {
        $owner = User::factory()->create();
        $item = Item::factory()->create([
            'user_id' => $owner->id,
            'assignee_id' => $this->user->id,
        ]);

        $this->assertTrue($this->auth->canUpdateItemFields($item, ['status', 'assignee_notes']));
    }

    public function test_assignee_cannot_update_restricted_fields(): void
    {
        $owner = User::factory()->create();
        $item = Item::factory()->create([
            'user_id' => $owner->id,
            'assignee_id' => $this->user->id,
        ]);

        $this->assertFalse($this->auth->canUpdateItemFields($item, ['title']));
        $this->assertFalse($this->auth->canUpdateItemFields($item, ['description']));
        $this->assertFalse($this->auth->canUpdateItemFields($item, ['project_id']));
    }

    public function test_assignee_can_self_unassign(): void
    {
        $owner = User::factory()->create();
        $item = Item::factory()->create([
            'user_id' => $owner->id,
            'assignee_id' => $this->user->id,
        ]);

        $this->assertTrue($this->auth->canUpdateItemFields($item, ['assignee_id'], ['assignee_id' => null]));
    }

    public function test_assignee_cannot_reassign_to_others(): void
    {
        $owner = User::factory()->create();
        $otherUser = User::factory()->create();
        $item = Item::factory()->create([
            'user_id' => $owner->id,
            'assignee_id' => $this->user->id,
        ]);

        $this->assertFalse($this->auth->canUpdateItemFields($item, ['assignee_id'], ['assignee_id' => (string) $otherUser->id]));
    }

    public function test_owner_can_delete_item(): void
    {
        $item = Item::factory()->create(['user_id' => $this->user->id]);

        $this->assertTrue($this->auth->canDeleteItem($item));
    }

    public function test_assignee_cannot_delete_item(): void
    {
        $owner = User::factory()->create();
        $item = Item::factory()->create([
            'user_id' => $owner->id,
            'assignee_id' => $this->user->id,
        ]);

        $this->assertFalse($this->auth->canDeleteItem($item));
    }
}

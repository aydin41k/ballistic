<?php

declare(strict_types=1);

namespace Tests\Unit\Mcp;

use App\Mcp\Services\McpAuthContext;
use App\Mcp\Tools\CompleteItemTool;
use App\Mcp\Tools\CreateItemTool;
use App\Mcp\Tools\CreateProjectTool;
use App\Mcp\Tools\CreateTagTool;
use App\Mcp\Tools\DeleteItemTool;
use App\Mcp\Tools\SearchItemsTool;
use App\Mcp\Tools\UpdateItemTool;
use App\Mcp\Tools\UpdateProjectTool;
use App\Models\Item;
use App\Models\Project;
use App\Models\Tag;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Mcp\Server\Tools\ToolResult;
use Tests\TestCase;

/**
 * Unit tests for MCP Tools following Laravel MCP testing patterns.
 *
 * These tests directly instantiate and test the tool classes
 * to verify their handle() methods return correct ToolResult responses.
 */
final class McpToolsTest extends TestCase
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
    // CREATE ITEM TOOL TESTS
    // ========================================================================

    public function test_create_item_tool_returns_success_result(): void
    {
        $tool = new CreateItemTool($this->auth);

        $result = $tool->handle([
            'title' => 'Test Item',
            'description' => 'Test Description',
        ]);

        $this->assertInstanceOf(ToolResult::class, $result);

        $resultArray = $result->toArray();
        $this->assertFalse($resultArray['isError']);

        $content = json_decode($resultArray['content'][0]['text'], true);
        $this->assertTrue($content['success']);
        $this->assertEquals('Test Item', $content['item']['title']);
        $this->assertEquals('Test Description', $content['item']['description']);
        $this->assertEquals('todo', $content['item']['status']);
    }

    public function test_create_item_tool_validates_required_title(): void
    {
        $tool = new CreateItemTool($this->auth);

        $result = $tool->handle([]);

        $this->assertInstanceOf(ToolResult::class, $result);

        $resultArray = $result->toArray();
        $this->assertTrue($resultArray['isError']);
        $this->assertStringContainsString('title', $resultArray['content'][0]['text']);
    }

    public function test_create_item_tool_validates_project_ownership(): void
    {
        $otherUser = User::factory()->create();
        $otherProject = Project::factory()->create(['user_id' => $otherUser->id]);

        $tool = new CreateItemTool($this->auth);

        $result = $tool->handle([
            'title' => 'Test Item',
            'project_id' => (string) $otherProject->id,
        ]);

        $resultArray = $result->toArray();
        $this->assertTrue($resultArray['isError']);
        $this->assertStringContainsString('Project not found', $resultArray['content'][0]['text']);
    }

    public function test_create_item_tool_validates_tag_ownership(): void
    {
        $otherUser = User::factory()->create();
        $otherTag = Tag::factory()->create(['user_id' => $otherUser->id]);

        $tool = new CreateItemTool($this->auth);

        $result = $tool->handle([
            'title' => 'Test Item',
            'tag_ids' => [(string) $otherTag->id],
        ]);

        $resultArray = $result->toArray();
        $this->assertTrue($resultArray['isError']);
        $this->assertStringContainsString('Tag not found', $resultArray['content'][0]['text']);
    }

    public function test_create_item_tool_validates_date_order(): void
    {
        $tool = new CreateItemTool($this->auth);

        $result = $tool->handle([
            'title' => 'Test Item',
            'scheduled_date' => '2026-12-31',
            'due_date' => '2026-01-01',
        ]);

        $resultArray = $result->toArray();
        $this->assertTrue($resultArray['isError']);
        $this->assertStringContainsString('due_date must be on or after', $resultArray['content'][0]['text']);
    }

    public function test_create_item_tool_with_valid_tags(): void
    {
        $tag1 = Tag::factory()->create(['user_id' => $this->user->id]);
        $tag2 = Tag::factory()->create(['user_id' => $this->user->id]);

        $tool = new CreateItemTool($this->auth);

        $result = $tool->handle([
            'title' => 'Tagged Item',
            'tag_ids' => [(string) $tag1->id, (string) $tag2->id],
        ]);

        $resultArray = $result->toArray();
        $this->assertFalse($resultArray['isError']);

        $content = json_decode($resultArray['content'][0]['text'], true);
        $this->assertCount(2, $content['item']['tags']);
    }

    // ========================================================================
    // UPDATE ITEM TOOL TESTS
    // ========================================================================

    public function test_update_item_tool_returns_success_result(): void
    {
        $item = Item::factory()->create(['user_id' => $this->user->id]);

        $tool = new UpdateItemTool($this->auth);

        $result = $tool->handle([
            'id' => (string) $item->id,
            'title' => 'Updated Title',
        ]);

        $resultArray = $result->toArray();
        $this->assertFalse($resultArray['isError']);

        $content = json_decode($resultArray['content'][0]['text'], true);
        $this->assertTrue($content['success']);
        $this->assertEquals('Updated Title', $content['item']['title']);
    }

    public function test_update_item_tool_returns_error_for_non_existent_item(): void
    {
        $tool = new UpdateItemTool($this->auth);

        $result = $tool->handle([
            'id' => '00000000-0000-0000-0000-000000000000',
            'title' => 'Updated Title',
        ]);

        $resultArray = $result->toArray();
        $this->assertTrue($resultArray['isError']);
        $this->assertStringContainsString('not found', $resultArray['content'][0]['text']);
    }

    public function test_update_item_tool_prevents_access_to_other_users_items(): void
    {
        $otherUser = User::factory()->create();
        $otherItem = Item::factory()->create(['user_id' => $otherUser->id]);

        $tool = new UpdateItemTool($this->auth);

        $result = $tool->handle([
            'id' => (string) $otherItem->id,
            'title' => 'Hacked Title',
        ]);

        $resultArray = $result->toArray();
        $this->assertTrue($resultArray['isError']);
        $this->assertStringContainsString('not found', $resultArray['content'][0]['text']);
    }

    public function test_update_item_tool_sets_completed_at_when_done(): void
    {
        $item = Item::factory()->create([
            'user_id' => $this->user->id,
            'status' => 'todo',
            'completed_at' => null,
        ]);

        $tool = new UpdateItemTool($this->auth);

        $result = $tool->handle([
            'id' => (string) $item->id,
            'status' => 'done',
        ]);

        $resultArray = $result->toArray();
        $this->assertFalse($resultArray['isError']);

        $item->refresh();
        $this->assertNotNull($item->completed_at);
    }

    public function test_update_item_tool_clears_completed_at_when_reopened(): void
    {
        $item = Item::factory()->create([
            'user_id' => $this->user->id,
            'status' => 'done',
            'completed_at' => now(),
        ]);

        $tool = new UpdateItemTool($this->auth);

        $result = $tool->handle([
            'id' => (string) $item->id,
            'status' => 'todo',
        ]);

        $resultArray = $result->toArray();
        $this->assertFalse($resultArray['isError']);

        $item->refresh();
        $this->assertNull($item->completed_at);
    }

    // ========================================================================
    // COMPLETE ITEM TOOL TESTS
    // ========================================================================

    public function test_complete_item_tool_marks_item_as_done(): void
    {
        $item = Item::factory()->create([
            'user_id' => $this->user->id,
            'status' => 'todo',
        ]);

        $tool = new CompleteItemTool($this->auth);

        $result = $tool->handle(['id' => (string) $item->id]);

        $resultArray = $result->toArray();
        $this->assertFalse($resultArray['isError']);

        $item->refresh();
        $this->assertEquals('done', $item->status);
        $this->assertNotNull($item->completed_at);
    }

    public function test_complete_item_tool_is_idempotent(): void
    {
        $completedAt = now()->subDay();
        $item = Item::factory()->create([
            'user_id' => $this->user->id,
            'status' => 'done',
            'completed_at' => $completedAt,
        ]);

        $tool = new CompleteItemTool($this->auth);

        $result = $tool->handle(['id' => (string) $item->id]);

        $resultArray = $result->toArray();
        $this->assertFalse($resultArray['isError']);

        $item->refresh();
        $this->assertEquals('done', $item->status);
    }

    public function test_complete_item_tool_accepts_assignee_notes(): void
    {
        $item = Item::factory()->create([
            'user_id' => $this->user->id,
            'status' => 'todo',
        ]);

        $tool = new CompleteItemTool($this->auth);

        $result = $tool->handle([
            'id' => (string) $item->id,
            'assignee_notes' => 'Completed with notes',
        ]);

        $resultArray = $result->toArray();
        $this->assertFalse($resultArray['isError']);

        $item->refresh();
        $this->assertEquals('Completed with notes', $item->assignee_notes);
    }

    // ========================================================================
    // DELETE ITEM TOOL TESTS
    // ========================================================================

    public function test_delete_item_tool_soft_deletes_item(): void
    {
        $item = Item::factory()->create(['user_id' => $this->user->id]);

        $tool = new DeleteItemTool($this->auth);

        $result = $tool->handle(['id' => (string) $item->id]);

        $resultArray = $result->toArray();
        $this->assertFalse($resultArray['isError']);

        $this->assertSoftDeleted('items', ['id' => $item->id]);
    }

    public function test_delete_item_tool_only_owner_can_delete(): void
    {
        $owner = User::factory()->create();
        $item = Item::factory()->create([
            'user_id' => $owner->id,
            'assignee_id' => $this->user->id, // Current user is assignee
        ]);

        $tool = new DeleteItemTool($this->auth);

        $result = $tool->handle(['id' => (string) $item->id]);

        $resultArray = $result->toArray();
        $this->assertTrue($resultArray['isError']);
        // Error message says "only the item owner can delete items"
        $this->assertStringContainsString('owner', strtolower($resultArray['content'][0]['text']));
    }

    // ========================================================================
    // SEARCH ITEMS TOOL TESTS
    // ========================================================================

    public function test_search_items_tool_returns_user_items(): void
    {
        Item::factory()->count(3)->create(['user_id' => $this->user->id]);
        Item::factory()->count(2)->create(); // Other user's items

        $tool = new SearchItemsTool($this->auth);

        $result = $tool->handle([]);

        $resultArray = $result->toArray();
        $this->assertFalse($resultArray['isError']);

        $content = json_decode($resultArray['content'][0]['text'], true);
        $this->assertEquals(3, $content['count']);
    }

    public function test_search_items_tool_filters_by_status(): void
    {
        Item::factory()->count(2)->create(['user_id' => $this->user->id, 'status' => 'todo']);
        Item::factory()->create(['user_id' => $this->user->id, 'status' => 'done']);

        $tool = new SearchItemsTool($this->auth);

        $result = $tool->handle(['status' => 'todo']);

        $resultArray = $result->toArray();
        $this->assertFalse($resultArray['isError']);

        $content = json_decode($resultArray['content'][0]['text'], true);
        $this->assertEquals(2, $content['count']);
    }

    public function test_search_items_tool_filters_by_project(): void
    {
        $project = Project::factory()->create(['user_id' => $this->user->id]);
        Item::factory()->count(2)->create(['user_id' => $this->user->id, 'project_id' => $project->id]);
        Item::factory()->create(['user_id' => $this->user->id, 'project_id' => null]);

        $tool = new SearchItemsTool($this->auth);

        $result = $tool->handle(['project_id' => (string) $project->id]);

        $resultArray = $result->toArray();
        $this->assertFalse($resultArray['isError']);

        $content = json_decode($resultArray['content'][0]['text'], true);
        $this->assertEquals(2, $content['count']);
    }

    public function test_search_items_tool_text_search(): void
    {
        Item::factory()->create(['user_id' => $this->user->id, 'title' => 'Buy groceries']);
        Item::factory()->create(['user_id' => $this->user->id, 'title' => 'Call dentist']);
        Item::factory()->create(['user_id' => $this->user->id, 'description' => 'Need to buy milk']);

        $tool = new SearchItemsTool($this->auth);

        $result = $tool->handle(['search' => 'buy']);

        $resultArray = $result->toArray();
        $this->assertFalse($resultArray['isError']);

        $content = json_decode($resultArray['content'][0]['text'], true);
        $this->assertEquals(2, $content['count']);
    }

    public function test_search_items_tool_respects_limit(): void
    {
        Item::factory()->count(10)->create(['user_id' => $this->user->id]);

        $tool = new SearchItemsTool($this->auth);

        $result = $tool->handle(['limit' => 3]);

        $resultArray = $result->toArray();
        $this->assertFalse($resultArray['isError']);

        $content = json_decode($resultArray['content'][0]['text'], true);
        $this->assertCount(3, $content['items']);
    }

    // ========================================================================
    // CREATE PROJECT TOOL TESTS
    // ========================================================================

    public function test_create_project_tool_returns_success_result(): void
    {
        $tool = new CreateProjectTool($this->auth);

        $result = $tool->handle([
            'name' => 'Test Project',
            'color' => '#FF5733',
        ]);

        $resultArray = $result->toArray();
        $this->assertFalse($resultArray['isError']);

        $content = json_decode($resultArray['content'][0]['text'], true);
        $this->assertTrue($content['success']);
        $this->assertEquals('Test Project', $content['project']['name']);
        $this->assertEquals('#FF5733', $content['project']['color']);
    }

    public function test_create_project_tool_validates_colour_format(): void
    {
        $tool = new CreateProjectTool($this->auth);

        $result = $tool->handle([
            'name' => 'Test Project',
            'color' => 'invalid-color',
        ]);

        $resultArray = $result->toArray();
        $this->assertTrue($resultArray['isError']);
        $this->assertStringContainsString('colour', strtolower($resultArray['content'][0]['text']));
    }

    // ========================================================================
    // UPDATE PROJECT TOOL TESTS
    // ========================================================================

    public function test_update_project_tool_archives_project(): void
    {
        $project = Project::factory()->create([
            'user_id' => $this->user->id,
            'archived_at' => null,
        ]);

        $tool = new UpdateProjectTool($this->auth);

        $result = $tool->handle([
            'id' => (string) $project->id,
            'archived' => true,
        ]);

        $resultArray = $result->toArray();
        $this->assertFalse($resultArray['isError']);

        $project->refresh();
        $this->assertNotNull($project->archived_at);
    }

    public function test_update_project_tool_restores_project(): void
    {
        $project = Project::factory()->create([
            'user_id' => $this->user->id,
            'archived_at' => now(),
        ]);

        $tool = new UpdateProjectTool($this->auth);

        $result = $tool->handle([
            'id' => (string) $project->id,
            'archived' => false,
        ]);

        $resultArray = $result->toArray();
        $this->assertFalse($resultArray['isError']);

        $project->refresh();
        $this->assertNull($project->archived_at);
    }

    public function test_update_project_tool_prevents_access_to_other_users_projects(): void
    {
        $otherUser = User::factory()->create();
        $otherProject = Project::factory()->create(['user_id' => $otherUser->id]);

        $tool = new UpdateProjectTool($this->auth);

        $result = $tool->handle([
            'id' => (string) $otherProject->id,
            'name' => 'Hacked Name',
        ]);

        $resultArray = $result->toArray();
        $this->assertTrue($resultArray['isError']);
        $this->assertStringContainsString('not found', $resultArray['content'][0]['text']);
    }

    // ========================================================================
    // CREATE TAG TOOL TESTS
    // ========================================================================

    public function test_create_tag_tool_returns_success_result(): void
    {
        $tool = new CreateTagTool($this->auth);

        $result = $tool->handle([
            'name' => 'Test Tag',
            'color' => '#00FF00',
        ]);

        $resultArray = $result->toArray();
        $this->assertFalse($resultArray['isError']);

        $content = json_decode($resultArray['content'][0]['text'], true);
        $this->assertTrue($content['success']);
        $this->assertEquals('Test Tag', $content['tag']['name']);
    }

    public function test_create_tag_tool_is_idempotent_for_duplicates(): void
    {
        $existingTag = Tag::factory()->create([
            'user_id' => $this->user->id,
            'name' => 'Existing Tag',
        ]);

        $tool = new CreateTagTool($this->auth);

        $result = $tool->handle(['name' => 'Existing Tag']);

        $resultArray = $result->toArray();
        $this->assertFalse($resultArray['isError']);

        $content = json_decode($resultArray['content'][0]['text'], true);
        $this->assertEquals((string) $existingTag->id, $content['tag']['id']);
    }

    public function test_create_tag_tool_validates_colour_format(): void
    {
        $tool = new CreateTagTool($this->auth);

        $result = $tool->handle([
            'name' => 'Test Tag',
            'color' => 'not-a-color',
        ]);

        $resultArray = $result->toArray();
        $this->assertTrue($resultArray['isError']);
        $this->assertStringContainsString('colour', strtolower($resultArray['content'][0]['text']));
    }
}

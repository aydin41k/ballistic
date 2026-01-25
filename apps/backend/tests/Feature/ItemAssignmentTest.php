<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Connection;
use App\Models\Item;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class ItemAssignmentTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Helper to create a mutual connection between two users.
     */
    private function createConnection(User $user1, User $user2): void
    {
        Connection::create([
            'requester_id' => $user1->id,
            'addressee_id' => $user2->id,
            'status' => 'accepted',
        ]);
    }

    public function test_owner_can_assign_item_to_connected_user(): void
    {
        $owner = User::factory()->create();
        $assignee = User::factory()->create();
        $this->createConnection($owner, $assignee);

        $item = Item::factory()->create(['user_id' => $owner->id]);

        $response = $this->actingAs($owner)
            ->patchJson("/api/items/{$item->id}", [
                'assignee_id' => $assignee->id,
            ]);

        $response->assertStatus(200)
            ->assertJsonFragment([
                'assignee_id' => $assignee->id,
                'is_assigned' => true,
                'is_delegated' => true,
            ]);

        $this->assertDatabaseHas('items', [
            'id' => $item->id,
            'assignee_id' => $assignee->id,
        ]);
    }

    public function test_owner_cannot_assign_item_to_unconnected_user(): void
    {
        $owner = User::factory()->create();
        $stranger = User::factory()->create();
        // No connection created

        $item = Item::factory()->create(['user_id' => $owner->id]);

        $response = $this->actingAs($owner)
            ->patchJson("/api/items/{$item->id}", [
                'assignee_id' => $stranger->id,
            ]);

        $response->assertStatus(403)
            ->assertJsonPath('message', 'You can only assign tasks to users you are connected with.');
    }

    public function test_cannot_create_item_with_unconnected_assignee(): void
    {
        $owner = User::factory()->create();
        $stranger = User::factory()->create();
        // No connection created

        $response = $this->actingAs($owner)
            ->postJson('/api/items', [
                'title' => 'Assigned Task',
                'status' => 'todo',
                'assignee_id' => $stranger->id,
            ]);

        $response->assertStatus(403)
            ->assertJsonPath('message', 'You can only assign tasks to users you are connected with.');
    }

    public function test_assignee_can_view_assigned_item(): void
    {
        $owner = User::factory()->create();
        $assignee = User::factory()->create();
        $this->createConnection($owner, $assignee);

        $item = Item::factory()->create([
            'user_id' => $owner->id,
            'assignee_id' => $assignee->id,
        ]);

        $response = $this->actingAs($assignee)
            ->getJson("/api/items/{$item->id}");

        $response->assertStatus(200)
            ->assertJsonFragment([
                'id' => $item->id,
            ]);
    }

    public function test_assignee_can_update_item_status(): void
    {
        $owner = User::factory()->create();
        $assignee = User::factory()->create();
        $this->createConnection($owner, $assignee);

        $item = Item::factory()->create([
            'user_id' => $owner->id,
            'assignee_id' => $assignee->id,
            'status' => 'todo',
        ]);

        $response = $this->actingAs($assignee)
            ->patchJson("/api/items/{$item->id}", [
                'status' => 'doing',
            ]);

        $response->assertStatus(200)
            ->assertJsonFragment([
                'status' => 'doing',
            ]);
    }

    public function test_assignee_cannot_delete_item(): void
    {
        $owner = User::factory()->create();
        $assignee = User::factory()->create();
        $this->createConnection($owner, $assignee);

        $item = Item::factory()->create([
            'user_id' => $owner->id,
            'assignee_id' => $assignee->id,
        ]);

        $response = $this->actingAs($assignee)
            ->deleteJson("/api/items/{$item->id}");

        $response->assertStatus(403);
    }

    public function test_owner_can_reassign_item(): void
    {
        $owner = User::factory()->create();
        $assignee1 = User::factory()->create();
        $assignee2 = User::factory()->create();
        $this->createConnection($owner, $assignee1);
        $this->createConnection($owner, $assignee2);

        $item = Item::factory()->create([
            'user_id' => $owner->id,
            'assignee_id' => $assignee1->id,
        ]);

        $response = $this->actingAs($owner)
            ->patchJson("/api/items/{$item->id}", [
                'assignee_id' => $assignee2->id,
            ]);

        $response->assertStatus(200)
            ->assertJsonFragment([
                'assignee_id' => $assignee2->id,
            ]);
    }

    public function test_owner_can_unassign_item(): void
    {
        $owner = User::factory()->create();
        $assignee = User::factory()->create();
        $this->createConnection($owner, $assignee);

        $item = Item::factory()->create([
            'user_id' => $owner->id,
            'assignee_id' => $assignee->id,
        ]);

        $response = $this->actingAs($owner)
            ->patchJson("/api/items/{$item->id}", [
                'assignee_id' => null,
            ]);

        $response->assertStatus(200)
            ->assertJsonFragment([
                'assignee_id' => null,
                'is_assigned' => false,
            ]);
    }

    public function test_unassigning_creates_notification(): void
    {
        $owner = User::factory()->create();
        $assignee = User::factory()->create();
        $this->createConnection($owner, $assignee);

        $item = Item::factory()->create([
            'user_id' => $owner->id,
            'assignee_id' => $assignee->id,
            'title' => 'My Task',
        ]);

        $this->actingAs($owner)
            ->patchJson("/api/items/{$item->id}", [
                'assignee_id' => null,
            ]);

        $this->assertDatabaseHas('notifications', [
            'user_id' => $assignee->id,
            'type' => 'task_unassigned',
        ]);
    }

    public function test_completing_task_notifies_assignee(): void
    {
        $owner = User::factory()->create();
        $assignee = User::factory()->create();
        $this->createConnection($owner, $assignee);

        $item = Item::factory()->create([
            'user_id' => $owner->id,
            'assignee_id' => $assignee->id,
            'title' => 'My Task',
            'status' => 'todo',
        ]);

        $this->actingAs($owner)
            ->patchJson("/api/items/{$item->id}", [
                'status' => 'done',
            ]);

        $this->assertDatabaseHas('notifications', [
            'user_id' => $assignee->id,
            'type' => 'task_completed',
        ]);
    }

    public function test_updating_task_title_notifies_assignee(): void
    {
        $owner = User::factory()->create();
        $assignee = User::factory()->create();
        $this->createConnection($owner, $assignee);

        $item = Item::factory()->create([
            'user_id' => $owner->id,
            'assignee_id' => $assignee->id,
            'title' => 'Original Title',
            'status' => 'todo',
        ]);

        $this->actingAs($owner)
            ->patchJson("/api/items/{$item->id}", [
                'title' => 'Updated Title',
            ]);

        $this->assertDatabaseHas('notifications', [
            'user_id' => $assignee->id,
            'type' => 'task_updated',
        ]);
    }

    public function test_items_api_filters_assigned_to_me(): void
    {
        $owner = User::factory()->create();
        $assignee = User::factory()->create();
        $this->createConnection($owner, $assignee);

        $ownedItem = Item::factory()->create(['user_id' => $assignee->id]);
        $assignedItem = Item::factory()->create([
            'user_id' => $owner->id,
            'assignee_id' => $assignee->id,
        ]);

        $response = $this->actingAs($assignee)
            ->getJson('/api/items?assigned_to_me=true');

        $response->assertStatus(200)
            ->assertJsonFragment(['id' => $assignedItem->id])
            ->assertJsonMissing(['id' => $ownedItem->id]);
    }

    public function test_items_api_filters_delegated(): void
    {
        $owner = User::factory()->create();
        $assignee = User::factory()->create();
        $this->createConnection($owner, $assignee);

        $unassignedItem = Item::factory()->create(['user_id' => $owner->id]);
        $delegatedItem = Item::factory()->create([
            'user_id' => $owner->id,
            'assignee_id' => $assignee->id,
        ]);

        $response = $this->actingAs($owner)
            ->getJson('/api/items?delegated=true');

        $response->assertStatus(200)
            ->assertJsonFragment(['id' => $delegatedItem->id])
            ->assertJsonMissing(['id' => $unassignedItem->id]);
    }

    public function test_default_items_api_excludes_assigned_items(): void
    {
        $owner = User::factory()->create();
        $assignee = User::factory()->create();
        $this->createConnection($owner, $assignee);

        $unassignedItem = Item::factory()->create([
            'user_id' => $owner->id,
            'assignee_id' => null,
            'status' => 'todo',
        ]);
        $delegatedItem = Item::factory()->create([
            'user_id' => $owner->id,
            'assignee_id' => $assignee->id,
            'status' => 'todo',
        ]);

        $response = $this->actingAs($owner)
            ->getJson('/api/items');

        $response->assertStatus(200)
            ->assertJsonFragment(['id' => $unassignedItem->id])
            ->assertJsonMissing(['id' => $delegatedItem->id]);
    }

    public function test_cannot_assign_to_nonexistent_user(): void
    {
        $owner = User::factory()->create();
        $item = Item::factory()->create(['user_id' => $owner->id]);

        $response = $this->actingAs($owner)
            ->patchJson("/api/items/{$item->id}", [
                'assignee_id' => '00000000-0000-0000-0000-000000000000',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['assignee_id']);
    }

    public function test_create_item_with_connected_assignee(): void
    {
        $owner = User::factory()->create();
        $assignee = User::factory()->create();
        $this->createConnection($owner, $assignee);

        $response = $this->actingAs($owner)
            ->postJson('/api/items', [
                'title' => 'Assigned Task',
                'status' => 'todo',
                'assignee_id' => $assignee->id,
            ]);

        $response->assertStatus(201)
            ->assertJsonFragment([
                'title' => 'Assigned Task',
                'assignee_id' => $assignee->id,
                'is_assigned' => true,
            ]);
    }

    public function test_pending_connection_does_not_allow_assignment(): void
    {
        $owner = User::factory()->create();
        $stranger = User::factory()->create();

        // Create pending (not accepted) connection
        Connection::create([
            'requester_id' => $owner->id,
            'addressee_id' => $stranger->id,
            'status' => 'pending',
        ]);

        $item = Item::factory()->create(['user_id' => $owner->id]);

        $response = $this->actingAs($owner)
            ->patchJson("/api/items/{$item->id}", [
                'assignee_id' => $stranger->id,
            ]);

        $response->assertStatus(403)
            ->assertJsonPath('message', 'You can only assign tasks to users you are connected with.');
    }

    public function test_assignee_can_only_update_status_and_notes(): void
    {
        $owner = User::factory()->create();
        $assignee = User::factory()->create();
        $this->createConnection($owner, $assignee);

        $item = Item::factory()->create([
            'user_id' => $owner->id,
            'assignee_id' => $assignee->id,
            'title' => 'Original Title',
            'status' => 'todo',
        ]);

        // Assignee should be able to update status
        $response = $this->actingAs($assignee)
            ->patchJson("/api/items/{$item->id}", [
                'status' => 'doing',
            ]);

        $response->assertStatus(200)
            ->assertJsonFragment(['status' => 'doing']);

        // Assignee should be able to update assignee_notes
        $response = $this->actingAs($assignee)
            ->patchJson("/api/items/{$item->id}", [
                'assignee_notes' => 'Working on this now',
            ]);

        $response->assertStatus(200)
            ->assertJsonFragment(['assignee_notes' => 'Working on this now']);
    }

    public function test_assignee_cannot_update_title(): void
    {
        $owner = User::factory()->create();
        $assignee = User::factory()->create();
        $this->createConnection($owner, $assignee);

        $item = Item::factory()->create([
            'user_id' => $owner->id,
            'assignee_id' => $assignee->id,
            'title' => 'Original Title',
        ]);

        $response = $this->actingAs($assignee)
            ->patchJson("/api/items/{$item->id}", [
                'title' => 'Changed Title',
            ]);

        $response->assertStatus(403)
            ->assertJsonPath('message', 'Assignees can only update status and notes.');
    }

    public function test_assignee_cannot_update_description(): void
    {
        $owner = User::factory()->create();
        $assignee = User::factory()->create();
        $this->createConnection($owner, $assignee);

        $item = Item::factory()->create([
            'user_id' => $owner->id,
            'assignee_id' => $assignee->id,
        ]);

        $response = $this->actingAs($assignee)
            ->patchJson("/api/items/{$item->id}", [
                'description' => 'Changed description',
            ]);

        $response->assertStatus(403)
            ->assertJsonPath('message', 'Assignees can only update status and notes.');
    }

    public function test_assignee_cannot_reassign_item(): void
    {
        $owner = User::factory()->create();
        $assignee = User::factory()->create();
        $anotherUser = User::factory()->create();
        $this->createConnection($owner, $assignee);
        $this->createConnection($owner, $anotherUser);

        $item = Item::factory()->create([
            'user_id' => $owner->id,
            'assignee_id' => $assignee->id,
        ]);

        $response = $this->actingAs($assignee)
            ->patchJson("/api/items/{$item->id}", [
                'assignee_id' => $anotherUser->id,
            ]);

        $response->assertStatus(403)
            ->assertJsonPath('message', 'Assignees can only update status and notes.');
    }

    public function test_owner_can_update_any_field(): void
    {
        $owner = User::factory()->create();
        $assignee = User::factory()->create();
        $this->createConnection($owner, $assignee);

        $item = Item::factory()->create([
            'user_id' => $owner->id,
            'assignee_id' => $assignee->id,
            'title' => 'Original Title',
            'description' => 'Original description',
        ]);

        // Owner should be able to update title
        $response = $this->actingAs($owner)
            ->patchJson("/api/items/{$item->id}", [
                'title' => 'Changed Title',
                'description' => 'Changed description',
            ]);

        $response->assertStatus(200)
            ->assertJsonFragment([
                'title' => 'Changed Title',
                'description' => 'Changed description',
            ]);
    }

    public function test_assignee_cannot_reorder_items(): void
    {
        $owner = User::factory()->create();
        $assignee = User::factory()->create();
        $this->createConnection($owner, $assignee);

        $item = Item::factory()->create([
            'user_id' => $owner->id,
            'assignee_id' => $assignee->id,
            'position' => 0,
        ]);

        $response = $this->actingAs($assignee)
            ->postJson('/api/items/reorder', [
                'items' => [
                    ['id' => $item->id, 'position' => 5],
                ],
            ]);

        $response->assertStatus(403);
    }

    public function test_owner_can_reorder_items(): void
    {
        $owner = User::factory()->create();

        $item1 = Item::factory()->create([
            'user_id' => $owner->id,
            'position' => 0,
        ]);
        $item2 = Item::factory()->create([
            'user_id' => $owner->id,
            'position' => 1,
        ]);

        $response = $this->actingAs($owner)
            ->postJson('/api/items/reorder', [
                'items' => [
                    ['id' => $item1->id, 'position' => 1],
                    ['id' => $item2->id, 'position' => 0],
                ],
            ]);

        $response->assertStatus(200);

        $this->assertEquals(1, $item1->fresh()->position);
        $this->assertEquals(0, $item2->fresh()->position);
    }
}

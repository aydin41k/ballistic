<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Item;
use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class ItemTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_create_item(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create(['user_id' => $user->id]);

        $itemData = [
            'title' => 'Test Item',
            'description' => 'Test Description',
            'status' => 'todo',
            'project_id' => $project->id,
            'position' => 0,
        ];

        $response = $this->actingAs($user)
            ->postJson('/api/items', $itemData);

        $response->assertStatus(201)
            ->assertJsonFragment([
                'title' => 'Test Item',
                'description' => 'Test Description',
                'status' => 'todo',
                'project_id' => $project->id,
                'position' => 0,
            ]);

        $this->assertDatabaseHas('items', [
            'title' => 'Test Item',
            'user_id' => $user->id,
            'project_id' => $project->id,
        ]);
    }

    public function test_user_can_create_inbox_item(): void
    {
        $user = User::factory()->create();

        $itemData = [
            'title' => 'Inbox Item',
            'description' => 'Inbox Description',
            'status' => 'todo',
            'project_id' => null,
            'position' => 0,
        ];

        $response = $this->actingAs($user)
            ->postJson('/api/items', $itemData);

        $response->assertStatus(201)
            ->assertJsonFragment([
                'title' => 'Inbox Item',
                'project_id' => null,
            ]);

        $this->assertDatabaseHas('items', [
            'title' => 'Inbox Item',
            'user_id' => $user->id,
            'project_id' => null,
        ]);
    }

    public function test_user_can_view_their_items(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create(['user_id' => $user->id]);
        $item = Item::factory()->create([
            'user_id' => $user->id,
            'project_id' => $project->id,
        ]);

        $response = $this->actingAs($user)
            ->getJson('/api/items');

        $response->assertStatus(200)
            ->assertJsonFragment([
                'id' => $item->id,
                'title' => $item->title,
            ]);
    }

    public function test_user_cannot_view_other_users_items(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $project = Project::factory()->create(['user_id' => $otherUser->id]);
        $item = Item::factory()->create([
            'user_id' => $otherUser->id,
            'project_id' => $project->id,
        ]);

        $response = $this->actingAs($user)
            ->getJson('/api/items');

        $response->assertStatus(200);
        $response->assertJsonMissing(['id' => $item->id]);
    }

    public function test_user_can_update_their_item(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create(['user_id' => $user->id]);
        $item = Item::factory()->create([
            'user_id' => $user->id,
            'project_id' => $project->id,
        ]);

        $updateData = [
            'title' => 'Updated Title',
            'status' => 'doing',
        ];

        $response = $this->actingAs($user)
            ->putJson("/api/items/{$item->id}", $updateData);

        $response->assertStatus(200)
            ->assertJsonFragment([
                'title' => 'Updated Title',
                'status' => 'doing',
            ]);

        $this->assertDatabaseHas('items', [
            'id' => $item->id,
            'title' => 'Updated Title',
            'status' => 'doing',
        ]);
    }

    public function test_user_can_delete_their_item(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create(['user_id' => $user->id]);
        $item = Item::factory()->create([
            'user_id' => $user->id,
            'project_id' => $project->id,
        ]);

        $response = $this->actingAs($user)
            ->deleteJson("/api/items/{$item->id}");

        $response->assertStatus(204);

        $this->assertSoftDeleted('items', [
            'id' => $item->id,
        ]);
    }

    public function test_user_cannot_access_other_users_item(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $project = Project::factory()->create(['user_id' => $otherUser->id]);
        $item = Item::factory()->create([
            'user_id' => $otherUser->id,
            'project_id' => $project->id,
        ]);

        $response = $this->actingAs($user)
            ->getJson("/api/items/{$item->id}");

        $response->assertStatus(403);
    }

    public function test_item_validation(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->postJson('/api/items', [
                'title' => '',
                'status' => 'invalid_status',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['title', 'status']);
    }
}

<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Item;
use App\Models\Project;
use App\Models\Tag;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class TagTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_create_tag(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->postJson('/api/tags', [
                'name' => 'Important',
                'color' => '#FF0000',
            ]);

        $response->assertStatus(201)
            ->assertJsonFragment([
                'name' => 'Important',
                'color' => '#FF0000',
            ]);

        $this->assertDatabaseHas('tags', [
            'name' => 'Important',
            'user_id' => $user->id,
        ]);
    }

    public function test_user_can_view_their_tags(): void
    {
        $user = User::factory()->create();
        $tag = Tag::factory()->create(['user_id' => $user->id]);

        $response = $this->actingAs($user)
            ->getJson('/api/tags');

        $response->assertStatus(200)
            ->assertJsonFragment([
                'id' => $tag->id,
                'name' => $tag->name,
            ]);
    }

    public function test_user_cannot_view_other_users_tags(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $tag = Tag::factory()->create(['user_id' => $otherUser->id]);

        $response = $this->actingAs($user)
            ->getJson('/api/tags');

        $response->assertStatus(200);
        $response->assertJsonMissing(['id' => $tag->id]);
    }

    public function test_user_can_update_their_tag(): void
    {
        $user = User::factory()->create();
        $tag = Tag::factory()->create(['user_id' => $user->id]);

        $response = $this->actingAs($user)
            ->putJson("/api/tags/{$tag->id}", [
                'name' => 'Updated Name',
                'color' => '#00FF00',
            ]);

        $response->assertStatus(200)
            ->assertJsonFragment([
                'name' => 'Updated Name',
                'color' => '#00FF00',
            ]);
    }

    public function test_user_cannot_update_other_users_tag(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $tag = Tag::factory()->create(['user_id' => $otherUser->id]);

        $response = $this->actingAs($user)
            ->putJson("/api/tags/{$tag->id}", [
                'name' => 'Updated Name',
            ]);

        $response->assertStatus(403);
    }

    public function test_user_can_delete_their_tag(): void
    {
        $user = User::factory()->create();
        $tag = Tag::factory()->create(['user_id' => $user->id]);

        $response = $this->actingAs($user)
            ->deleteJson("/api/tags/{$tag->id}");

        $response->assertStatus(204);

        $this->assertDatabaseMissing('tags', [
            'id' => $tag->id,
        ]);
    }

    public function test_tag_name_must_be_unique_per_user(): void
    {
        $user = User::factory()->create();
        Tag::factory()->create(['user_id' => $user->id, 'name' => 'Existing']);

        $response = $this->actingAs($user)
            ->postJson('/api/tags', [
                'name' => 'Existing',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name']);
    }

    public function test_same_tag_name_allowed_for_different_users(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        Tag::factory()->create(['user_id' => $user1->id, 'name' => 'Shared']);

        $response = $this->actingAs($user2)
            ->postJson('/api/tags', [
                'name' => 'Shared',
            ]);

        $response->assertStatus(201);
    }

    public function test_item_can_have_tags(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create(['user_id' => $user->id]);
        $tag1 = Tag::factory()->create(['user_id' => $user->id]);
        $tag2 = Tag::factory()->create(['user_id' => $user->id]);

        $response = $this->actingAs($user)
            ->postJson('/api/items', [
                'title' => 'Test Item',
                'status' => 'todo',
                'project_id' => $project->id,
                'tag_ids' => [$tag1->id, $tag2->id],
            ]);

        $response->assertStatus(201)
            ->assertJsonCount(2, 'data.tags');
    }

    public function test_user_cannot_assign_other_users_tags_to_item(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $tag = Tag::factory()->create(['user_id' => $otherUser->id]);

        $response = $this->actingAs($user)
            ->postJson('/api/items', [
                'title' => 'Test Item',
                'status' => 'todo',
                'tag_ids' => [$tag->id],
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['tag_ids.0']);
    }
}

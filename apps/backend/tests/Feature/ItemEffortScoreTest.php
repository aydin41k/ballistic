<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Item;
use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class ItemEffortScoreTest extends TestCase
{
    use RefreshDatabase;

    public function test_effort_score_defaults_to_one(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create(['user_id' => $user->id]);

        $response = $this->actingAs($user)
            ->postJson('/api/items', [
                'title' => 'Default effort item',
                'status' => 'todo',
                'project_id' => $project->id,
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.effort_score', 1);

        $this->assertDatabaseHas('items', [
            'title' => 'Default effort item',
            'effort_score' => 1,
        ]);
    }

    public function test_creating_item_with_effort_score_stores_correctly(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create(['user_id' => $user->id]);

        $response = $this->actingAs($user)
            ->postJson('/api/items', [
                'title' => 'High effort item',
                'status' => 'todo',
                'project_id' => $project->id,
                'effort_score' => 5,
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.effort_score', 5);

        $this->assertDatabaseHas('items', [
            'title' => 'High effort item',
            'effort_score' => 5,
        ]);
    }

    public function test_updating_effort_score_persists(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create(['user_id' => $user->id]);
        $item = Item::factory()->todo()->create([
            'user_id' => $user->id,
            'project_id' => $project->id,
            'effort_score' => 1,
        ]);

        $response = $this->actingAs($user)
            ->patchJson("/api/items/{$item->id}", [
                'effort_score' => 8,
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.effort_score', 8);

        $this->assertDatabaseHas('items', [
            'id' => $item->id,
            'effort_score' => 8,
        ]);
    }

    public function test_effort_score_validation_rejects_zero(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->postJson('/api/items', [
                'title' => 'Bad effort',
                'status' => 'todo',
                'effort_score' => 0,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors('effort_score');
    }

    public function test_effort_score_validation_rejects_four(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->postJson('/api/items', [
                'title' => 'Bad effort',
                'status' => 'todo',
                'effort_score' => 4,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors('effort_score');
    }

    public function test_effort_score_validation_rejects_nine(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->postJson('/api/items', [
                'title' => 'Bad effort',
                'status' => 'todo',
                'effort_score' => 9,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors('effort_score');
    }

    public function test_effort_score_validation_rejects_negative(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->postJson('/api/items', [
                'title' => 'Bad effort',
                'status' => 'todo',
                'effort_score' => -1,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors('effort_score');
    }

    public function test_effort_score_included_in_item_api_response(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create(['user_id' => $user->id]);
        Item::factory()->todo()->withEffort(3)->create([
            'user_id' => $user->id,
            'project_id' => $project->id,
        ]);

        $response = $this->actingAs($user)
            ->getJson('/api/items');

        $response->assertStatus(200);
        $items = $response->json('data');
        $this->assertNotEmpty($items);
        $this->assertArrayHasKey('effort_score', $items[0]);
        $this->assertSame(3, $items[0]['effort_score']);
    }
}

<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Item;
use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class ActivityLogTest extends TestCase
{
    use RefreshDatabase;

    public function test_activity_log_returns_cursor_paginated_items(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create(['user_id' => $user->id]);

        Item::factory()->count(5)->create([
            'user_id' => $user->id,
            'project_id' => $project->id,
        ]);

        $response = $this->actingAs($user)
            ->getJson('/api/activity-log');

        $response->assertStatus(200)
            ->assertJsonCount(5, 'data')
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'title',
                        'status',
                        'project',
                        'completed_at',
                        'created_at',
                        'updated_at',
                    ],
                ],
                'meta' => [
                    'path',
                    'per_page',
                    'next_cursor',
                    'prev_cursor',
                ],
            ]);
    }

    public function test_activity_log_orders_by_updated_at_descending(): void
    {
        $user = User::factory()->create();

        $oldest = Item::factory()->create([
            'user_id' => $user->id,
            'project_id' => null,
            'updated_at' => now()->subDays(2),
        ]);

        $newest = Item::factory()->create([
            'user_id' => $user->id,
            'project_id' => null,
            'updated_at' => now(),
        ]);

        $response = $this->actingAs($user)
            ->getJson('/api/activity-log');

        $response->assertStatus(200);
        $data = $response->json('data');
        $this->assertEquals($newest->id, $data[0]['id']);
        $this->assertEquals($oldest->id, $data[1]['id']);
    }

    public function test_activity_log_respects_per_page_parameter(): void
    {
        $user = User::factory()->create();

        Item::factory()->count(10)->create([
            'user_id' => $user->id,
            'project_id' => null,
        ]);

        $response = $this->actingAs($user)
            ->getJson('/api/activity-log?per_page=3');

        $response->assertStatus(200)
            ->assertJsonCount(3, 'data');
    }

    public function test_activity_log_caps_per_page_at_50(): void
    {
        $user = User::factory()->create();

        Item::factory()->count(5)->create([
            'user_id' => $user->id,
            'project_id' => null,
        ]);

        $response = $this->actingAs($user)
            ->getJson('/api/activity-log?per_page=100');

        $response->assertStatus(200);
        $this->assertEquals(50, $response->json('meta.per_page'));
    }

    public function test_activity_log_does_not_include_other_users_items(): void
    {
        $user = User::factory()->create();
        $other = User::factory()->create();

        Item::factory()->count(3)->create([
            'user_id' => $user->id,
            'project_id' => null,
        ]);

        Item::factory()->count(2)->create([
            'user_id' => $other->id,
            'project_id' => null,
        ]);

        $response = $this->actingAs($user)
            ->getJson('/api/activity-log');

        $response->assertStatus(200)
            ->assertJsonCount(3, 'data');
    }

    public function test_activity_log_supports_cursor_pagination(): void
    {
        $user = User::factory()->create();

        // Create items with distinct timestamps for stable cursor ordering
        for ($i = 0; $i < 5; $i++) {
            Item::factory()->create([
                'user_id' => $user->id,
                'project_id' => null,
                'updated_at' => now()->subMinutes(5 - $i),
            ]);
        }

        // Get first page
        $firstPage = $this->actingAs($user)
            ->getJson('/api/activity-log?per_page=2');

        $firstPage->assertStatus(200)
            ->assertJsonCount(2, 'data');

        $nextCursor = $firstPage->json('meta.next_cursor');
        $this->assertNotNull($nextCursor);

        // Get second page using cursor
        $secondPage = $this->actingAs($user)
            ->getJson('/api/activity-log?per_page=2&cursor='.urlencode($nextCursor));

        $secondPage->assertStatus(200)
            ->assertJsonCount(2, 'data');

        // Ensure no overlap
        $firstIds = array_column($firstPage->json('data'), 'id');
        $secondIds = array_column($secondPage->json('data'), 'id');
        $this->assertEmpty(array_intersect($firstIds, $secondIds));
    }

    public function test_activity_log_requires_authentication(): void
    {
        $response = $this->getJson('/api/activity-log');

        $response->assertStatus(401);
    }
}

<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\DailyStat;
use App\Models\Item;
use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StatsTest extends TestCase
{
    use RefreshDatabase;

    public function test_creating_an_item_increments_created_count(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $this->postJson('/api/items', [
            'title'    => 'Test item',
            'status'   => 'todo',
            'position' => 0,
        ], ['Authorization' => "Bearer {$token}"])->assertStatus(201);

        $stat = DailyStat::where('user_id', $user->id)
            ->where('date', now()->toDateString())
            ->first();

        $this->assertNotNull($stat);
        $this->assertGreaterThanOrEqual(1, $stat->created_count);
    }

    public function test_creating_an_item_with_done_status_increments_completed_count(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $this->postJson('/api/items', [
            'title'    => 'Already done',
            'status'   => 'done',
            'position' => 0,
        ], ['Authorization' => "Bearer {$token}"])->assertStatus(201);

        $stat = DailyStat::where('user_id', $user->id)
            ->where('date', now()->toDateString())
            ->first();

        $this->assertNotNull($stat);
        $this->assertGreaterThanOrEqual(1, $stat->completed_count);
    }

    public function test_marking_an_item_as_done_increments_completed_count(): void
    {
        $user    = User::factory()->create();
        $project = Project::factory()->create(['user_id' => $user->id]);
        $item    = Item::factory()->create([
            'user_id'    => $user->id,
            'project_id' => $project->id,
            'status'     => 'todo',
        ]);
        $token = $user->createToken('test')->plainTextToken;

        // Reset any stat that was created when the factory item was inserted
        DailyStat::where('user_id', $user->id)->delete();

        $this->patchJson("/api/items/{$item->id}", [
            'status' => 'done',
        ], ['Authorization' => "Bearer {$token}"])->assertStatus(200);

        $stat = DailyStat::where('user_id', $user->id)
            ->where('date', now()->toDateString())
            ->first();

        $this->assertNotNull($stat);
        $this->assertEquals(1, $stat->completed_count);
    }

    public function test_reverting_from_done_decrements_completed_count(): void
    {
        $user    = User::factory()->create();
        $project = Project::factory()->create(['user_id' => $user->id]);
        $item    = Item::factory()->done()->create([
            'user_id'    => $user->id,
            'project_id' => $project->id,
        ]);
        $token = $user->createToken('test')->plainTextToken;

        // Ensure there is a completed_count to decrement
        DailyStat::updateOrCreate(
            ['user_id' => $user->id, 'date' => now()->toDateString()],
            ['completed_count' => 1, 'created_count' => 1],
        );

        $this->patchJson("/api/items/{$item->id}", [
            'status' => 'todo',
        ], ['Authorization' => "Bearer {$token}"])->assertStatus(200);

        $stat = DailyStat::where('user_id', $user->id)
            ->where('date', now()->toDateString())
            ->first();

        $this->assertNotNull($stat);
        $this->assertEquals(0, $stat->completed_count);
    }

    public function test_stats_endpoint_returns_heatmap_data(): void
    {
        $user  = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        // Seed a daily_stats row
        DailyStat::create([
            'user_id'        => $user->id,
            'date'           => now()->toDateString(),
            'completed_count' => 5,
            'created_count'  => 8,
        ]);

        $response = $this->getJson('/api/stats', [
            'Authorization' => "Bearer {$token}",
        ])->assertStatus(200);

        $heatmap = $response->json('heatmap');
        $this->assertIsArray($heatmap);

        // Find today's entry
        $today = collect($heatmap)->firstWhere('date', now()->toDateString());
        $this->assertNotNull($today);
        $this->assertEquals(5, $today['completed_count']);
    }

    public function test_stats_endpoint_returns_category_distribution(): void
    {
        $user    = User::factory()->create();
        $project = Project::factory()->create(['user_id' => $user->id, 'name' => 'Work', 'color' => '#3B82F6']);
        $token   = $user->createToken('test')->plainTextToken;

        // Create a done item in the project
        Item::factory()->done()->create([
            'user_id'    => $user->id,
            'project_id' => $project->id,
        ]);

        $response = $this->getJson('/api/stats', [
            'Authorization' => "Bearer {$token}",
        ])->assertStatus(200);

        $categories = $response->json('category_distribution');
        $this->assertIsArray($categories);
        $this->assertGreaterThanOrEqual(1, count($categories));

        $workCategory = collect($categories)->firstWhere('project_name', 'Work');
        $this->assertNotNull($workCategory);
        $this->assertGreaterThanOrEqual(1, $workCategory['completed_count']);
        $this->assertEquals('#3B82F6', $workCategory['project_color']);
    }

    public function test_stats_endpoint_requires_authentication(): void
    {
        $this->getJson('/api/stats')->assertStatus(401);
    }

    public function test_stats_endpoint_respects_date_range(): void
    {
        $user  = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        // Seed two rows: one inside the range, one outside
        DailyStat::create([
            'user_id'        => $user->id,
            'date'           => now()->subDays(5)->toDateString(),
            'completed_count' => 3,
            'created_count'  => 4,
        ]);
        DailyStat::create([
            'user_id'        => $user->id,
            'date'           => now()->subDays(400)->toDateString(),
            'completed_count' => 99,
            'created_count'  => 99,
        ]);

        $response = $this->getJson('/api/stats?' . http_build_query([
            'from' => now()->subDays(30)->toDateString(),
            'to'   => now()->toDateString(),
        ]), [
            'Authorization' => "Bearer {$token}",
        ])->assertStatus(200);

        $heatmap = $response->json('heatmap');

        // The row from 400 days ago must not appear
        $old = collect($heatmap)->firstWhere('date', now()->subDays(400)->toDateString());
        $this->assertNull($old);

        // The row from 5 days ago must appear
        $recent = collect($heatmap)->firstWhere('date', now()->subDays(5)->toDateString());
        $this->assertNotNull($recent);
        $this->assertEquals(3, $recent['completed_count']);
    }
}

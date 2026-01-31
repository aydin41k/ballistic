<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\DailyStat;
use App\Models\Item;
use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class StatsTest extends TestCase
{
    use RefreshDatabase;

    public function test_stats_endpoint_requires_authentication(): void
    {
        $response = $this->getJson('/api/stats');

        $response->assertStatus(401);
    }

    public function test_stats_returns_empty_for_new_user(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->getJson('/api/stats?period=week');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'period' => ['from', 'to'],
                'totals' => ['completed', 'created'],
                'heatmap',
                'project_distribution',
                'streaks' => ['current', 'longest'],
            ])
            ->assertJson([
                'totals' => ['completed' => 0, 'created' => 0],
                'streaks' => ['current' => 0, 'longest' => 0],
            ]);
    }

    public function test_stats_returns_correct_date_range_for_week(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->getJson('/api/stats?period=week');

        $response->assertStatus(200);

        $data = $response->json();
        $from = $data['period']['from'];
        $to = $data['period']['to'];

        // Week should cover 7 days
        $this->assertCount(7, $data['heatmap']);
        $this->assertEquals(today()->subDays(6)->toDateString(), $from);
        $this->assertEquals(today()->toDateString(), $to);
    }

    public function test_stats_returns_correct_date_range_for_year(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->getJson('/api/stats?period=year');

        $response->assertStatus(200);

        $data = $response->json();

        // Year should cover 365 days
        $this->assertCount(365, $data['heatmap']);
    }

    public function test_observer_increments_created_count_on_item_create(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user);

        Item::factory()->create(['user_id' => $user->id]);

        $stat = DailyStat::where('user_id', $user->id)
            ->where('date', now()->toDateString())
            ->first();

        $this->assertNotNull($stat);
        $this->assertEquals(1, $stat->created_count);
    }

    public function test_observer_increments_completed_count_when_status_changes_to_done(): void
    {
        $user = User::factory()->create();
        $item = Item::factory()->create([
            'user_id' => $user->id,
            'status' => 'todo',
        ]);

        // Update status to done
        $item->update(['status' => 'done', 'completed_at' => now()]);

        $stat = DailyStat::where('user_id', $user->id)
            ->where('date', now()->toDateString())
            ->first();

        $this->assertNotNull($stat);
        $this->assertEquals(1, $stat->completed_count);
    }

    public function test_observer_decrements_completed_count_when_status_changes_from_done(): void
    {
        $user = User::factory()->create();
        $item = Item::factory()->create([
            'user_id' => $user->id,
            'status' => 'done',
            'completed_at' => now(),
        ]);

        // The item was created as done, so completed_count should be 1
        $stat = DailyStat::where('user_id', $user->id)
            ->where('date', now()->toDateString())
            ->first();

        $this->assertNotNull($stat);
        $this->assertEquals(1, $stat->completed_count);

        // Now change status back to todo
        $item->update(['status' => 'todo', 'completed_at' => null]);

        $stat->refresh();
        $this->assertEquals(0, $stat->completed_count);
    }

    public function test_observer_decrements_counts_on_item_delete(): void
    {
        $user = User::factory()->create();
        $item = Item::factory()->create([
            'user_id' => $user->id,
            'status' => 'done',
            'completed_at' => now(),
        ]);

        $stat = DailyStat::where('user_id', $user->id)
            ->where('date', now()->toDateString())
            ->first();

        $this->assertNotNull($stat);
        $this->assertEquals(1, $stat->created_count);
        $this->assertEquals(1, $stat->completed_count);

        // Delete the item
        $item->delete();

        $stat->refresh();
        $this->assertEquals(0, $stat->created_count);
        $this->assertEquals(0, $stat->completed_count);
    }

    public function test_stats_includes_project_distribution(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create(['user_id' => $user->id, 'name' => 'Work']);

        // Create completed items
        Item::factory()->count(3)->create([
            'user_id' => $user->id,
            'project_id' => $project->id,
            'status' => 'done',
            'completed_at' => now(),
        ]);

        $response = $this->actingAs($user)->getJson('/api/stats?period=week');

        $response->assertStatus(200);

        $data = $response->json();
        $this->assertCount(1, $data['project_distribution']);
        $this->assertEquals('Work', $data['project_distribution'][0]['project_name']);
        $this->assertEquals(3, $data['project_distribution'][0]['count']);
    }

    public function test_stats_includes_inbox_items_in_distribution(): void
    {
        $user = User::factory()->create();

        // Create inbox (no project) completed items
        Item::factory()->count(2)->create([
            'user_id' => $user->id,
            'project_id' => null,
            'status' => 'done',
            'completed_at' => now(),
        ]);

        $response = $this->actingAs($user)->getJson('/api/stats?period=week');

        $response->assertStatus(200);

        $data = $response->json();
        $this->assertCount(1, $data['project_distribution']);
        $this->assertEquals('Inbox', $data['project_distribution'][0]['project_name']);
        $this->assertNull($data['project_distribution'][0]['project_id']);
        $this->assertEquals(2, $data['project_distribution'][0]['count']);
    }

    public function test_stats_period_validation_rejects_invalid_values(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->getJson('/api/stats?period=invalid');

        $response->assertStatus(422);
    }

    public function test_stats_custom_date_range(): void
    {
        $user = User::factory()->create();

        $from = '2026-01-01';
        $to = '2026-01-07';

        $response = $this->actingAs($user)->getJson("/api/stats?from={$from}&to={$to}");

        $response->assertStatus(200);

        $data = $response->json();
        $this->assertEquals($from, $data['period']['from']);
        $this->assertEquals($to, $data['period']['to']);
        $this->assertCount(7, $data['heatmap']);
    }

    public function test_stats_validates_to_date_after_from_date(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->getJson('/api/stats?from=2026-01-10&to=2026-01-01');

        $response->assertStatus(422);
    }

    public function test_streak_calculation_for_consecutive_days(): void
    {
        $user = User::factory()->create();

        // Create stats for last 5 consecutive days
        for ($i = 0; $i < 5; $i++) {
            DailyStat::factory()->create([
                'user_id' => $user->id,
                'date' => now()->subDays($i)->toDateString(),
                'completed_count' => 1,
                'created_count' => 1,
            ]);
        }

        $response = $this->actingAs($user)->getJson('/api/stats?period=week');

        $response->assertStatus(200);

        $data = $response->json();
        $this->assertEquals(5, $data['streaks']['current']);
        $this->assertEquals(5, $data['streaks']['longest']);
    }

    public function test_streak_resets_on_gap(): void
    {
        $user = User::factory()->create();

        // Create stats for today and yesterday (current streak of 2)
        DailyStat::factory()->create([
            'user_id' => $user->id,
            'date' => now()->toDateString(),
            'completed_count' => 1,
        ]);
        DailyStat::factory()->create([
            'user_id' => $user->id,
            'date' => now()->subDays(1)->toDateString(),
            'completed_count' => 1,
        ]);

        // Skip day 2, then have 5 days streak at days 3-7 (longer past streak)
        for ($i = 3; $i <= 7; $i++) {
            DailyStat::factory()->create([
                'user_id' => $user->id,
                'date' => now()->subDays($i)->toDateString(),
                'completed_count' => 1,
            ]);
        }

        // Use year period to ensure we capture all days
        $response = $this->actingAs($user)->getJson('/api/stats?period=year');

        $response->assertStatus(200);

        $data = $response->json();

        // Current streak: today + yesterday = 2 consecutive days
        $this->assertEquals(2, $data['streaks']['current']);

        // Longest streak: days 3,4,5,6,7 = 5 consecutive days
        $this->assertEquals(5, $data['streaks']['longest']);
    }

    public function test_user_cannot_see_other_users_stats(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();

        // Create items for user2
        Item::factory()->count(5)->create([
            'user_id' => $user2->id,
            'status' => 'done',
            'completed_at' => now(),
        ]);

        // User1 should see empty stats
        $response = $this->actingAs($user1)->getJson('/api/stats?period=week');

        $response->assertStatus(200);

        $data = $response->json();
        $this->assertEquals(0, $data['totals']['completed']);
        $this->assertEquals(0, $data['totals']['created']);
    }

    public function test_heatmap_fills_missing_days_with_zeros(): void
    {
        $user = User::factory()->create();

        // Create a stat only for 3 days ago
        DailyStat::factory()->create([
            'user_id' => $user->id,
            'date' => now()->subDays(3)->toDateString(),
            'completed_count' => 5,
            'created_count' => 3,
        ]);

        $response = $this->actingAs($user)->getJson('/api/stats?period=week');

        $response->assertStatus(200);

        $data = $response->json();
        $this->assertCount(7, $data['heatmap']);

        // Verify all days are present
        $dates = array_column($data['heatmap'], 'date');
        for ($i = 6; $i >= 0; $i--) {
            $this->assertContains(now()->subDays($i)->toDateString(), $dates);
        }

        // Find the day with data
        $dayWithData = collect($data['heatmap'])->firstWhere('date', now()->subDays(3)->toDateString());
        $this->assertEquals(5, $dayWithData['completed']);
        $this->assertEquals(3, $dayWithData['created']);

        // Verify other days have zero
        $today = collect($data['heatmap'])->firstWhere('date', now()->toDateString());
        $this->assertEquals(0, $today['completed']);
        $this->assertEquals(0, $today['created']);
    }
}

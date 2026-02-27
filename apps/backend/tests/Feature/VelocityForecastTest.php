<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Item;
use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class VelocityForecastTest extends TestCase
{
    use RefreshDatabase;

    public function test_forecast_returns_valid_response_for_authenticated_user_with_velocity_flag(): void
    {
        $user = User::factory()->create([
            'feature_flags' => ['velocity' => true],
        ]);

        $response = $this->actingAs($user)
            ->getJson('/api/velocity/forecast');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'velocity',
                    'std_dev',
                    'capacity',
                    'demand',
                    'demand_task_count',
                    'burnout_risk',
                    'probability_of_success',
                    'data_points',
                    'weekly_totals',
                ],
            ]);
    }

    public function test_forecast_returns_401_for_unauthenticated(): void
    {
        $response = $this->getJson('/api/velocity/forecast');
        $response->assertStatus(401);
    }

    public function test_forecast_returns_404_when_velocity_flag_disabled(): void
    {
        $user = User::factory()->create([
            'feature_flags' => ['velocity' => false],
        ]);

        $response = $this->actingAs($user)
            ->getJson('/api/velocity/forecast');

        $response->assertStatus(404);
    }

    public function test_burnout_risk_flagged_when_demand_exceeds_velocity(): void
    {
        $user = User::factory()->create([
            'feature_flags' => ['velocity' => true],
        ]);

        $project = Project::factory()->create(['user_id' => $user->id]);

        // Create historical completed items with effort ~10/week across several weeks
        for ($week = 1; $week <= 8; $week++) {
            Item::factory()
                ->done()
                ->withEffort(2)
                ->count(5)
                ->create([
                    'user_id' => $user->id,
                    'project_id' => $project->id,
                    'completed_at' => now()->subWeeks($week)->addDays(1),
                ]);
        }

        // Create high-demand upcoming items (effort = 25 total, well above velocity ~10)
        $today = now()->toDateString();
        $nextWeek = now()->addDays(6)->toDateString();
        Item::factory()
            ->todo()
            ->withEffort(5)
            ->count(5)
            ->create([
                'user_id' => $user->id,
                'project_id' => $project->id,
                'due_date' => $nextWeek,
            ]);

        $response = $this->actingAs($user)
            ->getJson('/api/velocity/forecast');

        $response->assertStatus(200)
            ->assertJsonPath('data.burnout_risk', true);
    }

    public function test_no_burnout_when_demand_within_capacity(): void
    {
        $user = User::factory()->create([
            'feature_flags' => ['velocity' => true],
        ]);

        $project = Project::factory()->create(['user_id' => $user->id]);

        // Create historical completed items (~10/week)
        for ($week = 1; $week <= 8; $week++) {
            Item::factory()
                ->done()
                ->withEffort(2)
                ->count(5)
                ->create([
                    'user_id' => $user->id,
                    'project_id' => $project->id,
                    'completed_at' => now()->subWeeks($week)->addDays(1),
                ]);
        }

        // Low demand: 2 points total
        Item::factory()
            ->todo()
            ->withEffort(1)
            ->count(2)
            ->create([
                'user_id' => $user->id,
                'project_id' => $project->id,
                'due_date' => now()->addDays(3)->toDateString(),
            ]);

        $response = $this->actingAs($user)
            ->getJson('/api/velocity/forecast');

        $response->assertStatus(200)
            ->assertJsonPath('data.burnout_risk', false);
    }

    public function test_new_user_with_no_history_returns_zero_velocity(): void
    {
        $user = User::factory()->create([
            'feature_flags' => ['velocity' => true],
        ]);

        $response = $this->actingAs($user)
            ->getJson('/api/velocity/forecast');

        $response->assertStatus(200)
            ->assertJsonPath('data.velocity', 0)
            ->assertJsonPath('data.burnout_risk', false)
            ->assertJsonPath('data.probability_of_success', null);
    }

    public function test_new_user_with_demand_does_not_flag_burnout(): void
    {
        $user = User::factory()->create([
            'feature_flags' => ['velocity' => true],
        ]);

        $project = Project::factory()->create(['user_id' => $user->id]);

        // New user with upcoming tasks but zero completion history
        Item::factory()
            ->todo()
            ->withEffort(5)
            ->count(3)
            ->create([
                'user_id' => $user->id,
                'project_id' => $project->id,
                'due_date' => now()->addDays(3)->toDateString(),
            ]);

        $response = $this->actingAs($user)
            ->getJson('/api/velocity/forecast');

        $response->assertStatus(200)
            ->assertJsonPath('data.burnout_risk', false)
            ->assertJsonPath('data.probability_of_success', null);
    }
}

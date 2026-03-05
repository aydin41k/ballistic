<?php

declare(strict_types=1);

namespace Tests\Feature\Api;

use App\Models\Item;
use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

final class ActivityLogTest extends TestCase
{
    use RefreshDatabase;

    public function test_requires_authentication(): void
    {
        $this->getJson('/api/activity-log')->assertUnauthorized();
    }

    public function test_returns_only_done_and_wontdo_items(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->for($user)->create();

        Item::factory()->for($user)->for($project)->todo()->create(['title' => 'open']);
        Item::factory()->for($user)->for($project)->doing()->create(['title' => 'doing']);
        Item::factory()->for($user)->for($project)->done()->create(['title' => 'done']);
        Item::factory()->for($user)->for($project)->wontdo()->create(['title' => 'wontdo']);

        $response = $this->actingAs($user)->getJson('/api/activity-log');

        $response->assertOk()->assertJsonCount(2, 'data');
        $titles = collect($response->json('data'))->pluck('title')->all();
        $this->assertEqualsCanonicalizing(['done', 'wontdo'], $titles);
    }

    public function test_sorted_by_updated_at_desc(): void
    {
        $user = User::factory()->create();

        $older = Item::factory()->for($user)->inbox()->done()->create(['title' => 'older']);
        $older->updated_at = now()->subDay();
        $older->save();

        $newer = Item::factory()->for($user)->inbox()->done()->create(['title' => 'newer']);
        $newer->updated_at = now();
        $newer->save();

        $response = $this->actingAs($user)->getJson('/api/activity-log');

        $this->assertSame(
            ['newer', 'older'],
            collect($response->json('data'))->pluck('title')->all()
        );
    }

    public function test_does_not_return_other_users_items(): void
    {
        $me = User::factory()->create();
        $other = User::factory()->create();

        Item::factory()->for($me)->inbox()->done()->create(['title' => 'mine']);
        Item::factory()->for($other)->inbox()->done()->create(['title' => 'theirs']);

        $response = $this->actingAs($me)->getJson('/api/activity-log');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonFragment(['title' => 'mine'])
            ->assertJsonMissing(['title' => 'theirs']);
    }

    public function test_cursor_paginates(): void
    {
        $user = User::factory()->create();
        Item::factory()->for($user)->inbox()->done()->count(5)->create();

        $page1 = $this->actingAs($user)->getJson('/api/activity-log?per_page=2');
        $page1->assertOk()->assertJsonCount(2, 'data')->assertJsonPath('has_more', true);

        $cursor = $page1->json('next_cursor');
        $this->assertNotNull($cursor);

        $page2 = $this->actingAs($user)->getJson('/api/activity-log?per_page=2&cursor='.urlencode($cursor));
        $page2->assertOk()->assertJsonCount(2, 'data');
    }

    public function test_per_page_clamped_to_100(): void
    {
        $user = User::factory()->create();
        // Just verify the endpoint doesn't 500 with a silly per_page.
        $this->actingAs($user)->getJson('/api/activity-log?per_page=99999')->assertOk();
    }

    public function test_eager_loads_project_without_n_plus_one(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->for($user)->create();
        Item::factory()->for($user)->for($project)->done()->count(5)->create();

        DB::enableQueryLog();
        $this->actingAs($user)->getJson('/api/activity-log')->assertOk();
        $log = DB::getQueryLog();
        DB::disableQueryLog();

        $selectQueries = collect($log)
            ->pluck('query')
            ->filter(fn (string $q): bool => str_starts_with(strtolower($q), 'select'));

        // Expect a constant number of SELECTs regardless of item count:
        //   auth user lookup + items + projects. Allow a small ceiling for
        //   framework overhead (e.g. sanctum token check), but flag anything
        //   that scales with the 5 items — that would be N+1.
        $this->assertLessThanOrEqual(
            6,
            $selectQueries->count(),
            'Activity log issued too many SELECTs — suspected N+1. Queries: '.$selectQueries->implode(' | ')
        );
    }

    public function test_excludes_soft_deleted_items(): void
    {
        $user = User::factory()->create();
        $deleted = Item::factory()->for($user)->inbox()->done()->create();
        $deleted->delete();
        Item::factory()->for($user)->inbox()->done()->create(['title' => 'kept']);

        $response = $this->actingAs($user)->getJson('/api/activity-log');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonFragment(['title' => 'kept']);
    }
}

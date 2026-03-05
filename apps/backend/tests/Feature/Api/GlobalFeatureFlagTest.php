<?php

declare(strict_types=1);

namespace Tests\Feature\Api;

use App\Models\FeatureFlag;
use App\Services\FeatureFlagService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

final class GlobalFeatureFlagTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_endpoint_returns_key_value_map(): void
    {
        FeatureFlag::factory()->create(['key' => 'activity_log', 'enabled' => true]);
        FeatureFlag::factory()->create(['key' => 'beta_banner', 'enabled' => false]);

        $response = $this->getJson('/api/feature-flags');

        $response->assertOk()
            ->assertExactJson([
                'data' => [
                    'activity_log' => true,
                    'beta_banner' => false,
                ],
            ]);
    }

    public function test_public_endpoint_requires_no_authentication(): void
    {
        $this->getJson('/api/feature-flags')->assertOk();
    }

    public function test_service_serves_reads_from_cache_after_first_hit(): void
    {
        FeatureFlag::factory()->create(['key' => 'cached_flag', 'enabled' => true]);

        $service = app(FeatureFlagService::class);

        // First read: DB hit, populates cache.
        $queriesDuringFirst = $this->countQueries(fn () => $service->all());
        $this->assertGreaterThan(0, $queriesDuringFirst);

        // Second read: must be zero queries — served entirely from cache.
        $queriesDuringSecond = $this->countQueries(fn () => $service->all());
        $this->assertSame(
            0,
            $queriesDuringSecond,
            'FeatureFlagService->all() must not hit the DB when the cache is warm.'
        );

        $this->assertTrue($service->enabled('cached_flag'));
    }

    public function test_service_set_invalidates_cache(): void
    {
        $service = app(FeatureFlagService::class);

        FeatureFlag::factory()->create(['key' => 'toggle_me', 'enabled' => false]);
        $service->all(); // warm cache

        $service->set('toggle_me', true);

        // Cache was busted so the next read reflects the write.
        $this->assertTrue($service->enabled('toggle_me'));
    }

    public function test_service_set_creates_missing_flag(): void
    {
        $service = app(FeatureFlagService::class);

        $flag = $service->set('brand_new', true, 'Brand New', 'Test');

        $this->assertDatabaseHas('feature_flags', [
            'key' => 'brand_new',
            'enabled' => true,
            'label' => 'Brand New',
        ]);
        $this->assertTrue($service->enabled('brand_new'));
        $this->assertSame('brand_new', $flag->key);
    }

    public function test_enabled_returns_default_for_unknown_key(): void
    {
        $service = app(FeatureFlagService::class);

        $this->assertFalse($service->enabled('nonexistent'));
        $this->assertTrue($service->enabled('nonexistent', true));
    }

    public function test_set_preserves_existing_label_when_only_enabled_changes(): void
    {
        $service = app(FeatureFlagService::class);
        FeatureFlag::factory()->create([
            'key' => 'keep_meta',
            'enabled' => false,
            'label' => 'Original Label',
            'description' => 'Original desc',
        ]);

        $service->set('keep_meta', true);

        $fresh = FeatureFlag::query()->find('keep_meta');
        $this->assertTrue($fresh->enabled);
        $this->assertSame('Original Label', $fresh->label);
        $this->assertSame('Original desc', $fresh->description);
    }

    /**
     * Count SELECT/INSERT/UPDATE/DELETE queries executed during the callback.
     */
    private function countQueries(callable $fn): int
    {
        $count = 0;
        DB::listen(function () use (&$count): void {
            $count++;
        });
        try {
            $fn();
        } finally {
            // Flush listeners so subsequent calls start clean.
            DB::getEventDispatcher()->forget(\Illuminate\Database\Events\QueryExecuted::class);
        }

        return $count;
    }

    protected function setUp(): void
    {
        parent::setUp();
        // Tests manipulate cache directly — start each with a clean slate.
        Cache::flush();
    }
}

<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Services\VelocityForecastingService;
use PHPUnit\Framework\TestCase;

final class VelocityForecastingServiceTest extends TestCase
{
    private VelocityForecastingService $service;

    #[\Override]
    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new VelocityForecastingService;
    }

    public function test_ema_with_known_sequence(): void
    {
        $efforts = [10, 12, 8, 14, 10];
        $result = $this->service->calculateEma($efforts);

        $this->assertEqualsWithDelta(10.752, $result['ema'], 0.001);
        $this->assertGreaterThan(0.0, $result['std_dev']);
        $this->assertSame(5, $result['data_points']);
    }

    public function test_ema_with_single_point(): void
    {
        $result = $this->service->calculateEma([7]);

        $this->assertEqualsWithDelta(7.0, $result['ema'], 0.001);
        $this->assertEqualsWithDelta(0.0, $result['std_dev'], 0.001);
        $this->assertSame(1, $result['data_points']);
    }

    public function test_ema_with_empty_data(): void
    {
        $result = $this->service->calculateEma([]);

        $this->assertEqualsWithDelta(0.0, $result['ema'], 0.001);
        $this->assertEqualsWithDelta(0.0, $result['std_dev'], 0.001);
        $this->assertSame(0, $result['data_points']);
    }

    public function test_normal_cdf_at_zero(): void
    {
        $this->assertEqualsWithDelta(0.5, $this->service->normalCdf(0.0), 0.0001);
    }

    public function test_normal_cdf_at_positive_z(): void
    {
        // 90th percentile
        $this->assertEqualsWithDelta(0.95, $this->service->normalCdf(1.645), 0.001);
    }

    public function test_normal_cdf_at_negative_z(): void
    {
        // 10th percentile
        $this->assertEqualsWithDelta(0.05, $this->service->normalCdf(-1.645), 0.001);
    }

    public function test_normal_cdf_extreme_values(): void
    {
        $this->assertEqualsWithDelta(0.0, $this->service->normalCdf(-10.0), 0.0001);
        $this->assertEqualsWithDelta(1.0, $this->service->normalCdf(10.0), 0.0001);
    }

    public function test_probability_demand_exceeds_capacity(): void
    {
        // velocity ~10, std_dev ~1.5, demand = 25
        // z = (10 - 25) / 1.5 = -10 → P ≈ 0
        $probability = $this->service->calculateProbabilityOfSuccess(10.0, 1.5, 25.0);
        $this->assertLessThan(0.01, $probability);
    }

    public function test_probability_demand_below_capacity(): void
    {
        // velocity ~10, std_dev ~1.5, demand = 5
        // z = (10 - 5) / 1.5 = 3.33 → P ≈ 0.9996
        $probability = $this->service->calculateProbabilityOfSuccess(10.0, 1.5, 5.0);
        $this->assertGreaterThan(0.99, $probability);
    }

    public function test_probability_with_zero_std_dev_demand_below(): void
    {
        $probability = $this->service->calculateProbabilityOfSuccess(10.0, 0.0, 5.0);
        $this->assertEqualsWithDelta(1.0, $probability, 0.001);
    }

    public function test_probability_with_zero_std_dev_demand_above(): void
    {
        $probability = $this->service->calculateProbabilityOfSuccess(10.0, 0.0, 15.0);
        $this->assertEqualsWithDelta(0.0, $probability, 0.001);
    }

    public function test_gap_filling_inserts_zero_effort_weeks(): void
    {
        // Provide a single week of data keyed by Monday date
        $weeklyTotals = [
            '2026-02-23' => 10, // Monday of ISO week 9
        ];

        $filled = $this->service->fillWeekGaps($weeklyTotals, 4);

        // Should have 4 entries
        $this->assertCount(4, $filled);

        // The week with data should retain its value
        $found = false;
        foreach ($filled as $entry) {
            if ($entry['week_label'] === '2026-W09') {
                $this->assertSame(10, $entry['total_effort']);
                $found = true;
            }
        }

        // Verify all entries have the expected structure
        foreach ($filled as $entry) {
            $this->assertArrayHasKey('week_label', $entry);
            $this->assertArrayHasKey('total_effort', $entry);
            $this->assertIsInt($entry['total_effort']);
        }
    }

    public function test_ema_constant_input_converges(): void
    {
        // With constant input, EMA should converge to that constant
        $efforts = array_fill(0, 20, 5);
        $result = $this->service->calculateEma($efforts);

        $this->assertEqualsWithDelta(5.0, $result['ema'], 0.01);
    }
}

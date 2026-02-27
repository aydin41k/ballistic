<?php

declare(strict_types=1);

namespace App\Services;

use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

final class VelocityForecastingService
{
    private const float ALPHA = 0.3;

    private const int LOOKBACK_WEEKS = 12;

    private const float Z_90 = 1.645;

    /**
     * SQL expression that truncates completed_at to the Monday of its week.
     * Used as the canonical GROUP BY key — avoids driver-specific week numbering.
     */
    private function weekStartExpression(): string
    {
        return match (DB::getDriverName()) {
            'pgsql' => "DATE_TRUNC('week', completed_at)::date",
            'sqlite' => "date(completed_at, 'weekday 0', '-6 days')",
            default => 'DATE(completed_at - INTERVAL (WEEKDAY(completed_at)) DAY)',
        };
    }

    /**
     * Get weekly effort totals for a user over the lookback period.
     * Returns at most $weeks rows — all aggregation happens in the database.
     *
     * @return array<string, int> Keyed by Monday date (Y-m-d)
     */
    public function getWeeklyEffortTotals(string $userId, int $weeks = self::LOOKBACK_WEEKS): array
    {
        $lookbackDate = CarbonImmutable::now()->subWeeks($weeks)->startOfWeek();
        $expr = $this->weekStartExpression();

        $rows = DB::table('items')
            ->selectRaw("{$expr} AS week_start")
            ->selectRaw('COALESCE(SUM(effort_score), 0) AS total_effort')
            ->where('user_id', $userId)
            ->where('status', 'done')
            ->whereNotNull('completed_at')
            ->where('completed_at', '>=', $lookbackDate)
            ->whereNull('deleted_at')
            ->groupByRaw($expr)
            ->orderByRaw($expr)
            ->get();

        $totals = [];
        foreach ($rows as $row) {
            $totals[$row->week_start] = (int) $row->total_effort;
        }

        return $totals;
    }

    /**
     * Fill in zero-effort entries for weeks with no completions.
     *
     * @param  array<string, int>  $weeklyTotals  Keyed by Monday date (Y-m-d)
     * @return array<int, array{week_label: string, total_effort: int}>
     */
    public function fillWeekGaps(array $weeklyTotals, int $weeks = self::LOOKBACK_WEEKS): array
    {
        $now = CarbonImmutable::now();
        $filled = [];

        for ($i = $weeks - 1; $i >= 0; $i--) {
            $monday = $now->subWeeks($i)->startOfWeek();
            $key = $monday->format('Y-m-d');
            $weekLabel = $monday->format('o').'-W'.str_pad((string) $monday->isoWeek(), 2, '0', STR_PAD_LEFT);

            $filled[] = [
                'week_label' => $weekLabel,
                'total_effort' => $weeklyTotals[$key] ?? 0,
            ];
        }

        return $filled;
    }

    /**
     * Calculate EMA and exponentially-weighted standard deviation.
     *
     * @param  array<int, int>  $efforts  Chronological weekly effort values
     * @return array{ema: float, std_dev: float, data_points: int}
     */
    public function calculateEma(array $efforts, float $alpha = self::ALPHA): array
    {
        if (empty($efforts)) {
            return ['ema' => 0.0, 'std_dev' => 0.0, 'data_points' => 0];
        }

        $ema = (float) $efforts[0];
        $variance = 0.0;
        $count = count($efforts);

        for ($t = 1; $t < $count; $t++) {
            $x = (float) $efforts[$t];
            $diff = $x - $ema;
            $variance = (1.0 - $alpha) * ($variance + $alpha * $diff * $diff);
            $ema = $alpha * $x + (1.0 - $alpha) * $ema;
        }

        return [
            'ema' => $ema,
            'std_dev' => sqrt($variance),
            'data_points' => $count,
        ];
    }

    /**
     * Get upcoming demand (effort sum + task count) for the next N days.
     *
     * @return array{effort: int, task_count: int}
     */
    public function getUpcomingDemand(string $userId, int $days = 7): array
    {
        $today = CarbonImmutable::now()->toDateString();
        $endDate = CarbonImmutable::now()->addDays($days)->toDateString();

        $result = DB::table('items')
            ->selectRaw('COALESCE(SUM(effort_score), 0) AS total_effort')
            ->selectRaw('COUNT(*) AS task_count')
            ->where('user_id', $userId)
            ->whereNotIn('status', ['done', 'wontdo'])
            ->whereNotNull('due_date')
            ->whereBetween('due_date', [$today, $endDate])
            ->whereNull('deleted_at')
            ->first();

        return [
            'effort' => (int) ($result->total_effort ?? 0),
            'task_count' => (int) ($result->task_count ?? 0),
        ];
    }

    /**
     * Abramowitz & Stegun approximation of the standard normal CDF.
     * Error < 7.5e-8.
     */
    public function normalCdf(float $x): float
    {
        if ($x < -8.0) {
            return 0.0;
        }
        if ($x > 8.0) {
            return 1.0;
        }

        $negative = $x < 0.0;
        $x = abs($x);

        $k = 1.0 / (1.0 + 0.2316419 * $x);
        $k2 = $k * $k;
        $k3 = $k2 * $k;
        $k4 = $k3 * $k;
        $k5 = $k4 * $k;

        $pdf = exp(-0.5 * $x * $x) / sqrt(2.0 * M_PI);
        $cdf = 1.0 - $pdf * (
            0.319381530 * $k
            - 0.356563782 * $k2
            + 1.781477937 * $k3
            - 1.821255978 * $k4
            + 1.330274429 * $k5
        );

        return $negative ? 1.0 - $cdf : $cdf;
    }

    /**
     * Calculate probability of completing upcoming demand given EMA and std dev.
     */
    public function calculateProbabilityOfSuccess(float $ema, float $stdDev, float $demand): float
    {
        if ($stdDev <= 0.0) {
            return $demand <= $ema ? 1.0 : 0.0;
        }

        $zScore = ($ema - $demand) / $stdDev;

        return $this->normalCdf($zScore);
    }

    /**
     * Generate a full velocity forecast for a user.
     *
     * @return array{
     *     velocity: float,
     *     std_dev: float,
     *     capacity: float,
     *     demand: int,
     *     demand_task_count: int,
     *     burnout_risk: bool,
     *     probability_of_success: float|null,
     *     data_points: int,
     *     weekly_totals: array<int, array{week_label: string, total_effort: int}>
     * }
     */
    public function forecast(string $userId): array
    {
        $weeklyTotals = $this->getWeeklyEffortTotals($userId);
        $filledTotals = $this->fillWeekGaps($weeklyTotals);
        $hasHistory = $weeklyTotals !== [];

        $efforts = array_map(fn (array $entry): int => $entry['total_effort'], $filledTotals);
        $emaResult = $this->calculateEma($efforts);

        $demand = $this->getUpcomingDemand($userId);
        $capacity = $emaResult['ema'] + self::Z_90 * $emaResult['std_dev'];

        // Without completion history we have no signal — never flag burnout.
        $burnoutRisk = $hasHistory && (float) $demand['effort'] > $capacity;

        $probability = $hasHistory
            ? $this->calculateProbabilityOfSuccess(
                $emaResult['ema'],
                $emaResult['std_dev'],
                (float) $demand['effort']
            )
            : null;

        return [
            'velocity' => $emaResult['ema'],
            'std_dev' => $emaResult['std_dev'],
            'capacity' => $capacity,
            'demand' => $demand['effort'],
            'demand_task_count' => $demand['task_count'],
            'burnout_risk' => $burnoutRisk,
            'probability_of_success' => $probability,
            'data_points' => $emaResult['data_points'],
            'weekly_totals' => $filledTotals,
        ];
    }
}

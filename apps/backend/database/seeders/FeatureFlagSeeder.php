<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\FeatureFlag;
use App\Services\FeatureFlagService;
use Illuminate\Database\Seeder;

final class FeatureFlagSeeder extends Seeder
{
    /**
     * Baseline global flags. Keep this list in sync with any hard-coded
     * flag checks in the codebase so fresh environments boot with a
     * complete, predictable set.
     */
    private const DEFAULTS = [
        'activity_log' => [
            'enabled' => true,
            'label' => 'Activity Log',
            'description' => 'Shows done and won\'t-do items in a chronological "Recent Activity" feed.',
        ],
        'notification_centre' => [
            'enabled' => true,
            'label' => 'Notification Centre',
            'description' => 'Infinite-scroll notification history with bulk actions.',
        ],
        'project_exclusion' => [
            'enabled' => true,
            'label' => 'Project Exclusion Filter',
            'description' => 'Lets users hide selected projects from their main feed, persisted across devices.',
        ],
    ];

    public function run(): void
    {
        foreach (self::DEFAULTS as $key => $attrs) {
            FeatureFlag::query()->updateOrCreate(['key' => $key], $attrs);
        }

        app(FeatureFlagService::class)->flush();
    }
}

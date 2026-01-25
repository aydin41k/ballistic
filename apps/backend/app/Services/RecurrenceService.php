<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Item;
use Carbon\Carbon;

final class RecurrenceService
{
    /**
     * Common RRULE patterns for reference:
     * - FREQ=DAILY - Every day
     * - FREQ=WEEKLY - Every week
     * - FREQ=WEEKLY;BYDAY=MO,WE,FR - Every Monday, Wednesday, Friday
     * - FREQ=MONTHLY - Every month
     * - FREQ=MONTHLY;BYMONTHDAY=1 - First day of every month
     * - FREQ=YEARLY - Every year
     */

    /**
     * Parse an RRULE string into components.
     *
     * @return array<string, mixed>
     */
    public function parseRule(string $rrule): array
    {
        $parts = explode(';', $rrule);
        $result = [];

        foreach ($parts as $part) {
            $keyValue = explode('=', $part, 2);
            if (count($keyValue) === 2) {
                $key = strtoupper($keyValue[0]);
                $value = $keyValue[1];

                // Handle comma-separated values (like BYDAY=MO,WE,FR)
                if (str_contains($value, ',')) {
                    $result[$key] = explode(',', $value);
                } else {
                    $result[$key] = $value;
                }
            }
        }

        return $result;
    }

    /**
     * Generate recurring item instances for a given date range.
     *
     * @return array<Carbon>
     */
    public function getOccurrences(
        string $rrule,
        Carbon $startDate,
        Carbon $endDate,
        int $maxOccurrences = 100
    ): array {
        $rule = $this->parseRule($rrule);
        $occurrences = [];
        $freq = $rule['FREQ'] ?? 'DAILY';
        $interval = (int) ($rule['INTERVAL'] ?? 1);
        $count = isset($rule['COUNT']) ? (int) $rule['COUNT'] : null;
        $until = isset($rule['UNTIL']) ? Carbon::parse($rule['UNTIL']) : null;

        $current = $startDate->copy();
        $occurrenceCount = 0;

        while ($current->lte($endDate) && $occurrenceCount < $maxOccurrences) {
            if ($count !== null && $occurrenceCount >= $count) {
                break;
            }

            if ($until !== null && $current->gt($until)) {
                break;
            }

            if ($this->matchesRule($current, $rule)) {
                $occurrences[] = $current->copy();
                $occurrenceCount++;
            }

            $current = $this->advanceDate($current, $freq, $interval);
        }

        return $occurrences;
    }

    /**
     * Check if a date matches the rule constraints.
     */
    private function matchesRule(Carbon $date, array $rule): bool
    {
        // Check BYDAY constraint
        if (isset($rule['BYDAY'])) {
            $days = is_array($rule['BYDAY']) ? $rule['BYDAY'] : [$rule['BYDAY']];
            $dayMap = [
                'SU' => 0, 'MO' => 1, 'TU' => 2, 'WE' => 3,
                'TH' => 4, 'FR' => 5, 'SA' => 6,
            ];
            $currentDay = $date->dayOfWeek;
            $matchesDay = false;

            foreach ($days as $day) {
                if (isset($dayMap[$day]) && $dayMap[$day] === $currentDay) {
                    $matchesDay = true;
                    break;
                }
            }

            if (! $matchesDay) {
                return false;
            }
        }

        // Check BYMONTHDAY constraint
        if (isset($rule['BYMONTHDAY'])) {
            $monthDays = is_array($rule['BYMONTHDAY']) ? $rule['BYMONTHDAY'] : [$rule['BYMONTHDAY']];
            if (! in_array((string) $date->day, $monthDays)) {
                return false;
            }
        }

        // Check BYMONTH constraint
        if (isset($rule['BYMONTH'])) {
            $months = is_array($rule['BYMONTH']) ? $rule['BYMONTH'] : [$rule['BYMONTH']];
            if (! in_array((string) $date->month, $months)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Advance a date based on frequency.
     */
    private function advanceDate(Carbon $date, string $freq, int $interval): Carbon
    {
        return match ($freq) {
            'DAILY' => $date->addDays($interval),
            'WEEKLY' => $date->addWeeks($interval),
            'MONTHLY' => $date->addMonths($interval),
            'YEARLY' => $date->addYears($interval),
            default => $date->addDays($interval),
        };
    }

    /**
     * Generate recurring instances for an item within a date range.
     *
     * @return array<Item>
     */
    public function generateInstances(
        Item $templateItem,
        Carbon $startDate,
        Carbon $endDate
    ): array {
        if (! $templateItem->isRecurringTemplate()) {
            return [];
        }

        $occurrences = $this->getOccurrences(
            $templateItem->recurrence_rule,
            $startDate,
            $endDate
        );

        $instances = [];

        foreach ($occurrences as $date) {
            // Check if an instance already exists for this date
            $existingInstance = Item::where('recurrence_parent_id', $templateItem->id)
                ->whereDate('scheduled_date', $date)
                ->first();

            if ($existingInstance) {
                $instances[] = $existingInstance;

                continue;
            }

            // Create a new instance
            $instance = Item::create([
                'user_id' => $templateItem->user_id,
                'project_id' => $templateItem->project_id,
                'title' => $templateItem->title,
                'description' => $templateItem->description,
                'status' => 'todo',
                'position' => $templateItem->position,
                'scheduled_date' => $date,
                'due_date' => $templateItem->due_date ? $date : null,
                'recurrence_parent_id' => $templateItem->id,
            ]);

            // Copy tags from template
            if ($templateItem->tags->isNotEmpty()) {
                $instance->tags()->sync($templateItem->tags->pluck('id'));
            }

            $instances[] = $instance;
        }

        return $instances;
    }

    /**
     * Validate an RRULE string.
     */
    public function validateRule(string $rrule): bool
    {
        $rule = $this->parseRule($rrule);

        // Must have FREQ
        if (! isset($rule['FREQ'])) {
            return false;
        }

        // FREQ must be valid
        $validFreq = ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'];
        if (! in_array($rule['FREQ'], $validFreq)) {
            return false;
        }

        // BYDAY must have valid days
        if (isset($rule['BYDAY'])) {
            $validDays = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
            $days = is_array($rule['BYDAY']) ? $rule['BYDAY'] : [$rule['BYDAY']];
            foreach ($days as $day) {
                if (! in_array($day, $validDays)) {
                    return false;
                }
            }
        }

        return true;
    }
}

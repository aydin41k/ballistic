<?php

declare(strict_types=1);

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\FeatureFlag>
 */
final class FeatureFlagFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $key = Str::snake($this->faker->unique()->words(2, true));

        return [
            'key' => $key,
            'enabled' => $this->faker->boolean(),
            'label' => Str::headline($key),
            'description' => $this->faker->sentence(),
        ];
    }

    public function enabled(): static
    {
        return $this->state(['enabled' => true]);
    }

    public function disabled(): static
    {
        return $this->state(['enabled' => false]);
    }
}

<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\DailyStat;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\DailyStat>
 */
final class DailyStatFactory extends Factory
{
    protected $model = DailyStat::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'date' => $this->faker->dateTimeBetween('-1 year', 'now')->format('Y-m-d'),
            'completed_count' => $this->faker->numberBetween(0, 10),
            'created_count' => $this->faker->numberBetween(0, 10),
        ];
    }

    /**
     * State for a productive day (high completion count).
     */
    public function productive(): static
    {
        return $this->state(fn (array $attributes) => [
            'completed_count' => $this->faker->numberBetween(5, 15),
        ]);
    }

    /**
     * State for zero activity.
     */
    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'completed_count' => 0,
            'created_count' => 0,
        ]);
    }
}

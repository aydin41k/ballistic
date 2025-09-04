<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Item>
 */
class ItemFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => \App\Models\User::factory(),
            'project_id' => \App\Models\Project::factory(),
            'title' => $this->faker->sentence(3),
            'description' => $this->faker->optional(0.7)->paragraph(),
            'status' => $this->faker->randomElement(['todo', 'doing', 'done', 'wontdo']),
            'position' => $this->faker->numberBetween(0, 100),
        ];
    }

    public function inbox(): static
    {
        return $this->state(fn (array $attributes) => [
            'project_id' => null,
        ]);
    }

    public function todo(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'todo',
        ]);
    }

    public function doing(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'doing',
        ]);
    }

    public function done(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'done',
        ]);
    }

    public function wontdo(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'wontdo',
        ]);
    }
}

<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\AuditLog>
 */
final class AuditLogFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'admin_id' => User::factory()->admin(),
            'action' => fake()->randomElement(['user.hard_reset', 'user.role_changed', 'user.profile_updated']),
            'subject_type' => 'user',
            'subject_id' => fake()->uuid(),
            'old_values' => null,
            'new_values' => null,
            'ip_address' => fake()->ipv4(),
            'user_agent' => fake()->userAgent(),
        ];
    }

    public function hardReset(): static
    {
        return $this->state(fn () => [
            'action' => 'user.hard_reset',
            'old_values' => [
                'items_count' => fake()->numberBetween(0, 100),
                'projects_count' => fake()->numberBetween(0, 20),
                'tags_count' => fake()->numberBetween(0, 50),
                'notifications_count' => fake()->numberBetween(0, 200),
                'connections_count' => fake()->numberBetween(0, 30),
            ],
        ]);
    }

    public function roleChanged(): static
    {
        return $this->state(fn () => [
            'action' => 'user.role_changed',
            'old_values' => ['is_admin' => false],
            'new_values' => ['is_admin' => true],
        ]);
    }

    public function profileUpdated(): static
    {
        return $this->state(fn () => [
            'action' => 'user.profile_updated',
            'old_values' => ['name' => fake()->name()],
            'new_values' => ['name' => fake()->name()],
        ]);
    }
}

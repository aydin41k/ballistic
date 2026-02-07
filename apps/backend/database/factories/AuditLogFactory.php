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
            'user_id' => User::factory(),
            'action' => fake()->randomElement([
                'user_created',
                'user_updated',
                'user_deleted',
                'user_hard_reset',
                'admin_access_denied',
            ]),
            'resource_type' => fake()->randomElement(['user', 'item', 'project', null]),
            'resource_id' => fake()->uuid(),
            'ip_address' => fake()->ipv4(),
            'user_agent' => fake()->userAgent(),
            'status' => fake()->randomElement(['success', 'failed']),
            'metadata' => [
                'key' => fake()->word(),
                'value' => fake()->sentence(),
            ],
        ];
    }
}

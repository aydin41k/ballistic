<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class NotesTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_save_notes(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->patchJson('/api/user', ['notes' => 'My scratchpad content']);

        $response->assertStatus(200)
            ->assertJsonPath('data.notes', 'My scratchpad content');

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'notes' => 'My scratchpad content',
        ]);
    }

    public function test_notes_returned_in_user_profile(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->patchJson('/api/user', ['notes' => 'Existing notes']);

        $response = $this->actingAs($user)
            ->getJson('/api/user');

        $response->assertStatus(200)
            ->assertJsonPath('data.notes', 'Existing notes');
    }

    public function test_notes_respects_max_length(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->patchJson('/api/user', ['notes' => str_repeat('a', 10_001)]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors('notes');
    }

    public function test_notes_can_be_cleared(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->patchJson('/api/user', ['notes' => 'Some notes']);

        $response = $this->actingAs($user)
            ->patchJson('/api/user', ['notes' => null]);

        $response->assertStatus(200)
            ->assertJsonPath('data.notes', null);

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'notes' => null,
        ]);
    }

    public function test_notes_defaults_to_null_for_new_user(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->getJson('/api/user');

        $response->assertStatus(200)
            ->assertJsonPath('data.notes', null);
    }
}

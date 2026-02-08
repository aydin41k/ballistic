<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Connection;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class FavouriteTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Helper to create a mutual connection between two users.
     */
    private function createConnection(User $user1, User $user2): void
    {
        Connection::create([
            'requester_id' => $user1->id,
            'addressee_id' => $user2->id,
            'status' => 'accepted',
        ]);
    }

    public function test_user_can_add_a_favourite(): void
    {
        $user = User::factory()->create();
        $target = User::factory()->create();

        $response = $this->actingAs($user)
            ->postJson("/api/favourites/{$target->id}");

        $response->assertStatus(200)
            ->assertJson([
                'is_favourite' => true,
            ]);

        $this->assertDatabaseHas('user_favourites', [
            'user_id' => $user->id,
            'favourite_id' => $target->id,
        ]);
    }

    public function test_user_can_toggle_favourite_off(): void
    {
        $user = User::factory()->create();
        $target = User::factory()->create();

        // Add first
        $user->favourites()->attach((string) $target->id);

        // Toggle off
        $response = $this->actingAs($user)
            ->postJson("/api/favourites/{$target->id}");

        $response->assertStatus(200)
            ->assertJson([
                'is_favourite' => false,
            ]);

        $this->assertDatabaseMissing('user_favourites', [
            'user_id' => $user->id,
            'favourite_id' => $target->id,
        ]);
    }

    public function test_user_cannot_favourite_themselves(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->postJson("/api/favourites/{$user->id}");

        $response->assertStatus(422)
            ->assertJson([
                'message' => 'You cannot favourite yourself.',
            ]);
    }

    public function test_favouriting_non_existent_user_returns_404(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->postJson('/api/favourites/00000000-0000-0000-0000-000000000000');

        $response->assertStatus(404);
    }

    public function test_favourites_appear_in_user_lookup_first(): void
    {
        $searcher = User::factory()->create();
        $favUser = User::factory()->create([
            'email' => 'fav@example.com',
            'name' => 'Fav User',
        ]);
        $otherUser = User::factory()->create([
            'email' => 'other@example.com',
            'name' => 'Other User',
        ]);

        $this->createConnection($searcher, $favUser);
        $this->createConnection($searcher, $otherUser);

        // Mark favUser as favourite
        $searcher->favourites()->attach((string) $favUser->id);

        $response = $this->actingAs($searcher)
            ->getJson('/api/users/lookup?q=fav@example.com');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', (string) $favUser->id);
    }

    public function test_case_insensitive_email_search_in_user_lookup(): void
    {
        $searcher = User::factory()->create();
        $target = User::factory()->create([
            'email' => 'CaseTest@Example.COM',
            'name' => 'Case Test User',
        ]);

        $this->createConnection($searcher, $target);

        $response = $this->actingAs($searcher)
            ->getJson('/api/users/lookup?q=casetest@example.com');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', (string) $target->id);
    }

    public function test_case_insensitive_email_search_in_user_discovery(): void
    {
        $searcher = User::factory()->create();
        $target = User::factory()->create([
            'email' => 'Discovery@Example.COM',
            'name' => 'Discovery User',
        ]);

        $response = $this->actingAs($searcher)
            ->postJson('/api/users/discover', ['email' => 'discovery@example.com']);

        $response->assertStatus(200)
            ->assertJson([
                'found' => true,
            ])
            ->assertJsonPath('user.id', (string) $target->id);
    }

    public function test_favourites_included_in_api_user_response(): void
    {
        $user = User::factory()->create();
        $fav = User::factory()->create(['name' => 'My Fav']);

        $user->favourites()->attach((string) $fav->id);

        $response = $this->actingAs($user)
            ->getJson('/api/user');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data.favourites')
            ->assertJsonPath('data.favourites.0.id', (string) $fav->id);
    }

    public function test_unauthenticated_request_returns_401(): void
    {
        $target = User::factory()->create();

        $response = $this->postJson("/api/favourites/{$target->id}");

        $response->assertStatus(401);
    }

    public function test_favourite_toggle_returns_full_favourites_list(): void
    {
        $user = User::factory()->create();
        $fav1 = User::factory()->create();
        $fav2 = User::factory()->create();

        $user->favourites()->attach((string) $fav1->id);

        $response = $this->actingAs($user)
            ->postJson("/api/favourites/{$fav2->id}");

        $response->assertStatus(200)
            ->assertJson(['is_favourite' => true])
            ->assertJsonCount(2, 'favourites');
    }
}

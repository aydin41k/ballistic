<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Connection;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class UserLookupTest extends TestCase
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

    public function test_user_can_search_connected_user_by_email(): void
    {
        $searcher = User::factory()->create();
        $targetUser = User::factory()->create([
            'email' => 'john.doe@example.com',
            'name' => 'John Doe',
        ]);
        $this->createConnection($searcher, $targetUser);

        $response = $this->actingAs($searcher)
            ->getJson('/api/users/lookup?q=john.doe@example.com');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonFragment([
                'id' => $targetUser->id,
                'name' => 'John Doe',
            ]);
    }

    public function test_user_cannot_search_unconnected_user(): void
    {
        $searcher = User::factory()->create();
        $stranger = User::factory()->create([
            'email' => 'stranger@example.com',
            'name' => 'Stranger',
        ]);
        // No connection created

        $response = $this->actingAs($searcher)
            ->getJson('/api/users/lookup?q=stranger@example.com');

        $response->assertStatus(200)
            ->assertJsonCount(0, 'data');
    }

    public function test_user_can_search_connected_user_by_phone_suffix(): void
    {
        $searcher = User::factory()->create();
        $targetUser = User::factory()->create([
            'phone' => '+61412345678',
            'name' => 'Jane Smith',
        ]);
        $this->createConnection($searcher, $targetUser);

        // Search by last 9 digits
        $response = $this->actingAs($searcher)
            ->getJson('/api/users/lookup?q=412345678');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonFragment([
                'id' => $targetUser->id,
                'name' => 'Jane Smith',
            ]);
    }

    public function test_search_excludes_current_user(): void
    {
        $searcher = User::factory()->create([
            'email' => 'searcher@example.com',
        ]);

        $response = $this->actingAs($searcher)
            ->getJson('/api/users/lookup?q=searcher@example.com');

        $response->assertStatus(200)
            ->assertJsonCount(0, 'data');
    }

    public function test_search_requires_authentication(): void
    {
        $response = $this->getJson('/api/users/lookup?q=test@example.com');

        $response->assertStatus(401);
    }

    public function test_search_requires_minimum_query_length(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->getJson('/api/users/lookup?q=ab');

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['q']);
    }

    public function test_search_returns_masked_email(): void
    {
        $searcher = User::factory()->create();
        $targetUser = User::factory()->create([
            'email' => 'john.doe@example.com',
            'name' => 'John Doe',
        ]);
        $this->createConnection($searcher, $targetUser);

        $response = $this->actingAs($searcher)
            ->getJson('/api/users/lookup?q=john.doe@example.com');

        $response->assertStatus(200)
            ->assertJsonFragment([
                'email_masked' => 'j***@example.com',
            ]);

        // Ensure full email is not exposed
        $response->assertJsonMissing([
            'email' => 'john.doe@example.com',
        ]);
    }

    public function test_search_with_international_phone_format(): void
    {
        $searcher = User::factory()->create();
        $targetUser = User::factory()->create([
            'phone' => '+61 412 345 678',
            'name' => 'Aussie User',
        ]);
        $this->createConnection($searcher, $targetUser);

        // Search with just the digits
        $response = $this->actingAs($searcher)
            ->getJson('/api/users/lookup?q=412345678');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonFragment([
                'id' => $targetUser->id,
            ]);
    }

    public function test_search_returns_empty_for_no_matches(): void
    {
        $searcher = User::factory()->create();
        $connectedUser = User::factory()->create([
            'email' => 'friend@example.com',
        ]);
        $this->createConnection($searcher, $connectedUser);

        // Search for a different email that doesn't match any connected user
        $response = $this->actingAs($searcher)
            ->getJson('/api/users/lookup?q=nonexistent@email.com');

        $response->assertStatus(200)
            ->assertJsonCount(0, 'data');
    }

    public function test_search_returns_empty_when_no_connections(): void
    {
        $searcher = User::factory()->create();
        User::factory()->create([
            'email' => 'someone@example.com',
        ]);

        $response = $this->actingAs($searcher)
            ->getJson('/api/users/lookup?q=someone@example.com');

        $response->assertStatus(200)
            ->assertJsonCount(0, 'data');
    }

    public function test_pending_connection_not_searchable(): void
    {
        $searcher = User::factory()->create();
        $pendingUser = User::factory()->create([
            'email' => 'pending@example.com',
        ]);

        // Create pending (not accepted) connection
        Connection::create([
            'requester_id' => $searcher->id,
            'addressee_id' => $pendingUser->id,
            'status' => 'pending',
        ]);

        $response = $this->actingAs($searcher)
            ->getJson('/api/users/lookup?q=pending@example.com');

        $response->assertStatus(200)
            ->assertJsonCount(0, 'data');
    }
}

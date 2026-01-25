<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Connection;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class ConnectionTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_send_connection_request(): void
    {
        $requester = User::factory()->create();
        $addressee = User::factory()->create();

        $response = $this->actingAs($requester)->postJson('/api/connections', [
            'user_id' => $addressee->id,
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('message', 'Connection request sent.');

        $this->assertDatabaseHas('connections', [
            'requester_id' => $requester->id,
            'addressee_id' => $addressee->id,
            'status' => 'pending',
        ]);
    }

    public function test_connection_request_creates_notification(): void
    {
        $requester = User::factory()->create();
        $addressee = User::factory()->create();

        $this->actingAs($requester)->postJson('/api/connections', [
            'user_id' => $addressee->id,
        ]);

        $this->assertDatabaseHas('notifications', [
            'user_id' => $addressee->id,
            'type' => 'connection_request',
        ]);
    }

    public function test_user_cannot_send_connection_request_to_self(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/connections', [
            'user_id' => $user->id,
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('message', 'You cannot send a connection request to yourself.');
    }

    public function test_user_cannot_send_duplicate_connection_request(): void
    {
        $requester = User::factory()->create();
        $addressee = User::factory()->create();

        Connection::create([
            'requester_id' => $requester->id,
            'addressee_id' => $addressee->id,
            'status' => 'pending',
        ]);

        $response = $this->actingAs($requester)->postJson('/api/connections', [
            'user_id' => $addressee->id,
        ]);

        $response->assertStatus(409)
            ->assertJsonPath('message', 'A connection request is already pending.');
    }

    public function test_user_can_accept_connection_request(): void
    {
        $requester = User::factory()->create();
        $addressee = User::factory()->create();

        $connection = Connection::create([
            'requester_id' => $requester->id,
            'addressee_id' => $addressee->id,
            'status' => 'pending',
        ]);

        $response = $this->actingAs($addressee)->postJson("/api/connections/{$connection->id}/accept");

        $response->assertStatus(200)
            ->assertJsonPath('message', 'Connection accepted.');

        $this->assertDatabaseHas('connections', [
            'id' => $connection->id,
            'status' => 'accepted',
        ]);
    }

    public function test_accepting_connection_creates_notification(): void
    {
        $requester = User::factory()->create();
        $addressee = User::factory()->create();

        $connection = Connection::create([
            'requester_id' => $requester->id,
            'addressee_id' => $addressee->id,
            'status' => 'pending',
        ]);

        $this->actingAs($addressee)->postJson("/api/connections/{$connection->id}/accept");

        $this->assertDatabaseHas('notifications', [
            'user_id' => $requester->id,
            'type' => 'connection_accepted',
        ]);
    }

    public function test_only_addressee_can_accept_connection(): void
    {
        $requester = User::factory()->create();
        $addressee = User::factory()->create();
        $otherUser = User::factory()->create();

        $connection = Connection::create([
            'requester_id' => $requester->id,
            'addressee_id' => $addressee->id,
            'status' => 'pending',
        ]);

        // Requester cannot accept their own request
        $response = $this->actingAs($requester)->postJson("/api/connections/{$connection->id}/accept");
        $response->assertStatus(403);

        // Other user cannot accept
        $response = $this->actingAs($otherUser)->postJson("/api/connections/{$connection->id}/accept");
        $response->assertStatus(403);
    }

    public function test_user_can_decline_connection_request(): void
    {
        $requester = User::factory()->create();
        $addressee = User::factory()->create();

        $connection = Connection::create([
            'requester_id' => $requester->id,
            'addressee_id' => $addressee->id,
            'status' => 'pending',
        ]);

        $response = $this->actingAs($addressee)->postJson("/api/connections/{$connection->id}/decline");

        $response->assertStatus(200)
            ->assertJsonPath('message', 'Connection declined.');

        $this->assertDatabaseHas('connections', [
            'id' => $connection->id,
            'status' => 'declined',
        ]);
    }

    public function test_user_can_remove_connection(): void
    {
        $requester = User::factory()->create();
        $addressee = User::factory()->create();

        $connection = Connection::create([
            'requester_id' => $requester->id,
            'addressee_id' => $addressee->id,
            'status' => 'accepted',
        ]);

        // Either party can remove
        $response = $this->actingAs($requester)->deleteJson("/api/connections/{$connection->id}");
        $response->assertStatus(204);

        $this->assertDatabaseMissing('connections', ['id' => $connection->id]);
    }

    public function test_user_can_list_connections(): void
    {
        $user = User::factory()->create();
        $friend1 = User::factory()->create();
        $friend2 = User::factory()->create();
        $pending = User::factory()->create();

        // Create accepted connections
        Connection::create([
            'requester_id' => $user->id,
            'addressee_id' => $friend1->id,
            'status' => 'accepted',
        ]);

        Connection::create([
            'requester_id' => $friend2->id,
            'addressee_id' => $user->id,
            'status' => 'accepted',
        ]);

        // Create pending request
        Connection::create([
            'requester_id' => $pending->id,
            'addressee_id' => $user->id,
            'status' => 'pending',
        ]);

        $response = $this->actingAs($user)->getJson('/api/connections');

        $response->assertStatus(200);

        $data = $response->json('data');
        $this->assertCount(3, $data);
    }

    public function test_user_can_filter_connections_by_status(): void
    {
        $user = User::factory()->create();
        $friend = User::factory()->create();
        $pending = User::factory()->create();

        Connection::create([
            'requester_id' => $user->id,
            'addressee_id' => $friend->id,
            'status' => 'accepted',
        ]);

        Connection::create([
            'requester_id' => $pending->id,
            'addressee_id' => $user->id,
            'status' => 'pending',
        ]);

        // Filter by accepted
        $response = $this->actingAs($user)->getJson('/api/connections?status=accepted');
        $data = $response->json('data');
        $this->assertCount(1, $data);
        $this->assertEquals('accepted', $data[0]['status']);

        // Filter by pending
        $response = $this->actingAs($user)->getJson('/api/connections?status=pending');
        $data = $response->json('data');
        $this->assertCount(1, $data);
        $this->assertEquals('pending_received', $data[0]['status']);
    }

    public function test_sending_request_to_existing_requester_auto_accepts(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();

        // User2 sends request to User1
        Connection::create([
            'requester_id' => $user2->id,
            'addressee_id' => $user1->id,
            'status' => 'pending',
        ]);

        // User1 sends request to User2 - should auto-accept
        $response = $this->actingAs($user1)->postJson('/api/connections', [
            'user_id' => $user2->id,
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('message', 'Connection request accepted.');

        $this->assertDatabaseHas('connections', [
            'requester_id' => $user2->id,
            'addressee_id' => $user1->id,
            'status' => 'accepted',
        ]);
    }

    public function test_user_can_send_request_after_previous_decline(): void
    {
        $requester = User::factory()->create();
        $addressee = User::factory()->create();

        // Create and decline a connection
        Connection::create([
            'requester_id' => $requester->id,
            'addressee_id' => $addressee->id,
            'status' => 'declined',
        ]);

        // Should be able to send a new request
        $response = $this->actingAs($requester)->postJson('/api/connections', [
            'user_id' => $addressee->id,
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('message', 'Connection request sent.');
    }

    public function test_is_connected_with_method(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        $user3 = User::factory()->create();

        // Create accepted connection between user1 and user2
        Connection::create([
            'requester_id' => $user1->id,
            'addressee_id' => $user2->id,
            'status' => 'accepted',
        ]);

        // Create pending connection between user1 and user3
        Connection::create([
            'requester_id' => $user1->id,
            'addressee_id' => $user3->id,
            'status' => 'pending',
        ]);

        $this->assertTrue($user1->isConnectedWith($user2));
        $this->assertTrue($user2->isConnectedWith($user1));
        $this->assertFalse($user1->isConnectedWith($user3));
        $this->assertFalse($user2->isConnectedWith($user3));
    }

    public function test_connections_method_returns_connected_users(): void
    {
        $user = User::factory()->create();
        $friend1 = User::factory()->create();
        $friend2 = User::factory()->create();
        $notFriend = User::factory()->create();

        Connection::create([
            'requester_id' => $user->id,
            'addressee_id' => $friend1->id,
            'status' => 'accepted',
        ]);

        Connection::create([
            'requester_id' => $friend2->id,
            'addressee_id' => $user->id,
            'status' => 'accepted',
        ]);

        Connection::create([
            'requester_id' => $user->id,
            'addressee_id' => $notFriend->id,
            'status' => 'pending',
        ]);

        $connections = $user->connections();

        $this->assertCount(2, $connections);
        $this->assertTrue($connections->contains('id', $friend1->id));
        $this->assertTrue($connections->contains('id', $friend2->id));
        $this->assertFalse($connections->contains('id', $notFriend->id));
    }

    public function test_requires_authentication(): void
    {
        $response = $this->getJson('/api/connections');
        $response->assertStatus(401);

        $response = $this->postJson('/api/connections', ['user_id' => 'fake-id']);
        $response->assertStatus(401);
    }
}

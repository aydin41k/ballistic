<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Connection;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class NotificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_receives_notification_when_assigned_task(): void
    {
        $owner = User::factory()->create();
        $assignee = User::factory()->create();

        // Create connection between owner and assignee (required for task assignment)
        Connection::create([
            'requester_id' => $owner->id,
            'addressee_id' => $assignee->id,
            'status' => 'accepted',
        ]);

        $response = $this->actingAs($owner)
            ->postJson('/api/items', [
                'title' => 'Assigned Task',
                'status' => 'todo',
                'assignee_id' => $assignee->id,
            ]);

        $response->assertStatus(201);

        // Check notification was created
        $this->assertDatabaseHas('notifications', [
            'user_id' => $assignee->id,
            'type' => 'task_assigned',
        ]);
    }

    public function test_user_can_fetch_notifications(): void
    {
        $user = User::factory()->create();

        Notification::create([
            'user_id' => $user->id,
            'type' => 'task_assigned',
            'title' => 'New Task',
            'message' => 'Someone assigned you a task',
            'data' => ['item_id' => 'test-id'],
        ]);

        $response = $this->actingAs($user)
            ->getJson('/api/notifications');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonFragment([
                'type' => 'task_assigned',
                'title' => 'New Task',
            ]);
    }

    public function test_user_can_fetch_only_unread_notifications(): void
    {
        $user = User::factory()->create();

        Notification::create([
            'user_id' => $user->id,
            'type' => 'task_assigned',
            'title' => 'Unread Notification',
            'message' => 'This is unread',
        ]);

        Notification::create([
            'user_id' => $user->id,
            'type' => 'task_assigned',
            'title' => 'Read Notification',
            'message' => 'This is read',
            'read_at' => now(),
        ]);

        $response = $this->actingAs($user)
            ->getJson('/api/notifications?unread_only=true');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonFragment([
                'title' => 'Unread Notification',
            ]);
    }

    public function test_user_can_mark_notification_as_read(): void
    {
        $user = User::factory()->create();

        $notification = Notification::create([
            'user_id' => $user->id,
            'type' => 'task_assigned',
            'title' => 'Test Notification',
            'message' => 'Test message',
        ]);

        $response = $this->actingAs($user)
            ->postJson("/api/notifications/{$notification->id}/read");

        $response->assertStatus(200)
            ->assertJsonFragment([
                'message' => 'Notification marked as read.',
            ]);

        $this->assertNotNull($notification->fresh()->read_at);
    }

    public function test_user_can_mark_all_notifications_as_read(): void
    {
        $user = User::factory()->create();

        Notification::create([
            'user_id' => $user->id,
            'type' => 'task_assigned',
            'title' => 'Notification 1',
            'message' => 'Message 1',
        ]);

        Notification::create([
            'user_id' => $user->id,
            'type' => 'task_assigned',
            'title' => 'Notification 2',
            'message' => 'Message 2',
        ]);

        $response = $this->actingAs($user)
            ->postJson('/api/notifications/read-all');

        $response->assertStatus(200)
            ->assertJsonFragment([
                'marked_count' => 2,
            ]);

        $this->assertEquals(0, $user->unreadNotifications()->count());
    }

    public function test_user_cannot_mark_other_users_notification_as_read(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();

        $notification = Notification::create([
            'user_id' => $user1->id,
            'type' => 'task_assigned',
            'title' => 'User 1 Notification',
            'message' => 'This belongs to user 1',
        ]);

        $response = $this->actingAs($user2)
            ->postJson("/api/notifications/{$notification->id}/read");

        $response->assertStatus(403);
    }

    public function test_notification_includes_unread_count(): void
    {
        $user = User::factory()->create();

        Notification::create([
            'user_id' => $user->id,
            'type' => 'task_assigned',
            'title' => 'Notification 1',
            'message' => 'Message 1',
        ]);

        Notification::create([
            'user_id' => $user->id,
            'type' => 'task_assigned',
            'title' => 'Notification 2',
            'message' => 'Message 2',
        ]);

        $response = $this->actingAs($user)
            ->getJson('/api/notifications');

        $response->assertStatus(200)
            ->assertJsonFragment([
                'unread_count' => 2,
            ]);
    }

    public function test_notifications_require_authentication(): void
    {
        $response = $this->getJson('/api/notifications');

        $response->assertStatus(401);
    }
}

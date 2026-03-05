<?php

declare(strict_types=1);

namespace Tests\Feature\Api;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class NotificationCentreTest extends TestCase
{
    use RefreshDatabase;

    public function test_index_returns_cursor_and_has_more(): void
    {
        $user = User::factory()->create();
        $this->seedNotifications($user, 5);

        $response = $this->actingAs($user)->getJson('/api/notifications?per_page=2');

        $response->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('has_more', true);

        $this->assertNotNull($response->json('next_cursor'));
    }

    public function test_cursor_fetches_next_page(): void
    {
        $user = User::factory()->create();
        $this->seedNotifications($user, 5);

        $page1 = $this->actingAs($user)->getJson('/api/notifications?per_page=2');
        $cursor = $page1->json('next_cursor');

        $page2 = $this->actingAs($user)->getJson('/api/notifications?per_page=2&cursor='.urlencode($cursor));

        $page2->assertOk()->assertJsonCount(2, 'data');

        // Pages do not overlap.
        $ids1 = collect($page1->json('data'))->pluck('id');
        $ids2 = collect($page2->json('data'))->pluck('id');
        $this->assertEmpty($ids1->intersect($ids2));
    }

    public function test_clear_read_deletes_only_read_notifications(): void
    {
        $user = User::factory()->create();

        $read = Notification::create([
            'user_id' => $user->id,
            'type' => 'task_assigned',
            'title' => 'Read',
            'message' => 'Read message',
            'read_at' => now(),
        ]);
        $unread = Notification::create([
            'user_id' => $user->id,
            'type' => 'task_assigned',
            'title' => 'Unread',
            'message' => 'Unread message',
        ]);

        $response = $this->actingAs($user)->deleteJson('/api/notifications/read');

        $response->assertOk()
            ->assertJsonPath('deleted_count', 1)
            ->assertJsonPath('unread_count', 1);

        $this->assertDatabaseMissing('notifications', ['id' => $read->id]);
        $this->assertDatabaseHas('notifications', ['id' => $unread->id]);
    }

    public function test_clear_read_is_scoped_to_authenticated_user(): void
    {
        $me = User::factory()->create();
        $other = User::factory()->create();

        Notification::create([
            'user_id' => $me->id,
            'type' => 'task_assigned',
            'title' => 'Mine',
            'message' => 'm',
            'read_at' => now(),
        ]);
        $theirs = Notification::create([
            'user_id' => $other->id,
            'type' => 'task_assigned',
            'title' => 'Theirs',
            'message' => 't',
            'read_at' => now(),
        ]);

        $this->actingAs($me)->deleteJson('/api/notifications/read')->assertOk();

        // Other user's read notification survives.
        $this->assertDatabaseHas('notifications', ['id' => $theirs->id]);
    }

    public function test_clear_read_is_noop_when_nothing_to_delete(): void
    {
        $user = User::factory()->create();
        Notification::create([
            'user_id' => $user->id,
            'type' => 'task_assigned',
            'title' => 'Unread',
            'message' => 'm',
        ]);

        $response = $this->actingAs($user)->deleteJson('/api/notifications/read');

        $response->assertOk()->assertJsonPath('deleted_count', 0);
        $this->assertDatabaseCount('notifications', 1);
    }

    public function test_clear_read_requires_authentication(): void
    {
        $this->deleteJson('/api/notifications/read')->assertUnauthorized();
    }

    public function test_mark_all_as_read_now_includes_zero_unread_count(): void
    {
        $user = User::factory()->create();
        $this->seedNotifications($user, 3);

        $response = $this->actingAs($user)->postJson('/api/notifications/read-all');

        $response->assertOk()->assertJsonPath('unread_count', 0);
    }

    private function seedNotifications(User $user, int $count): void
    {
        for ($i = 0; $i < $count; $i++) {
            Notification::create([
                'user_id' => $user->id,
                'type' => 'task_assigned',
                'title' => "Notification {$i}",
                'message' => "Message {$i}",
            ]);
        }
    }
}

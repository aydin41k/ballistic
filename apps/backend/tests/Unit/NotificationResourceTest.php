<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Http\Resources\NotificationResource;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Tests\TestCase;

final class NotificationResourceTest extends TestCase
{
    use RefreshDatabase;

    public function test_notification_resource_includes_all_fields(): void
    {
        $user = User::factory()->create();

        $notification = Notification::create([
            'user_id' => $user->id,
            'type' => 'test',
            'title' => 'Test Notification',
            'message' => 'Test message',
            'data' => ['key' => 'value'],
        ]);

        $resource = new NotificationResource($notification);
        $result = $resource->toArray(new Request);

        $this->assertArrayHasKey('id', $result);
        $this->assertArrayHasKey('user_id', $result);
        $this->assertArrayHasKey('type', $result);
        $this->assertArrayHasKey('title', $result);
        $this->assertArrayHasKey('message', $result);
        $this->assertArrayHasKey('data', $result);
        $this->assertArrayHasKey('read_at', $result);
        $this->assertArrayHasKey('created_at', $result);
        $this->assertArrayHasKey('updated_at', $result);
        $this->assertArrayHasKey('created_at_human', $result);
    }

    public function test_notification_resource_returns_correct_values(): void
    {
        $user = User::factory()->create();

        $notification = Notification::create([
            'user_id' => $user->id,
            'type' => 'task_assigned',
            'title' => 'New Task',
            'message' => 'You have a new task',
            'data' => ['item_id' => 'task-123'],
        ]);

        $resource = new NotificationResource($notification);
        $result = $resource->toArray(new Request);

        $this->assertEquals($notification->id, $result['id']);
        $this->assertEquals($user->id, $result['user_id']);
        $this->assertEquals('task_assigned', $result['type']);
        $this->assertEquals('New Task', $result['title']);
        $this->assertEquals('You have a new task', $result['message']);
        $this->assertEquals(['item_id' => 'task-123'], $result['data']);
    }

    public function test_null_read_at(): void
    {
        $user = User::factory()->create();

        $notification = Notification::create([
            'user_id' => $user->id,
            'type' => 'test',
            'title' => 'Test',
            'message' => 'Test',
        ]);

        $resource = new NotificationResource($notification);
        $result = $resource->toArray(new Request);

        $this->assertNull($result['read_at']);
    }

    public function test_with_read_at(): void
    {
        $user = User::factory()->create();

        $notification = Notification::create([
            'user_id' => $user->id,
            'type' => 'test',
            'title' => 'Test',
            'message' => 'Test',
        ]);
        $notification->markAsRead();
        $notification->refresh();

        $resource = new NotificationResource($notification);
        $result = $resource->toArray(new Request);

        $this->assertNotNull($result['read_at']);
        $this->assertStringContainsString('T', $result['read_at']); // ISO 8601 format
    }

    public function test_created_at_human_is_string(): void
    {
        $user = User::factory()->create();

        $notification = Notification::create([
            'user_id' => $user->id,
            'type' => 'test',
            'title' => 'Test',
            'message' => 'Test',
        ]);

        $resource = new NotificationResource($notification);
        $result = $resource->toArray(new Request);

        $this->assertIsString($result['created_at_human']);
        // Just created, should be "Just now"
        $this->assertEquals('Just now', $result['created_at_human']);
    }

    public function test_created_at_human_format_variations(): void
    {
        // Test that the relative time returns expected formats
        // This is a simple validation that the format follows expected patterns
        $validPatterns = [
            '/^Just now$/',
            '/^\d+ minutes? ago$/',
            '/^\d+ hours? ago$/',
            '/^Yesterday$/',
            '/^\d+ days? ago$/',
            '/^\d+ weeks? ago$/',
            '/^\d{1,2} [A-Z][a-z]{2}$/', // e.g., "25 Jan"
            '/^\d{1,2} [A-Z][a-z]{2} \d{4}$/', // e.g., "25 Jan 2025"
        ];

        $user = User::factory()->create();
        $notification = Notification::create([
            'user_id' => $user->id,
            'type' => 'test',
            'title' => 'Test',
            'message' => 'Test',
        ]);

        $resource = new NotificationResource($notification);
        $result = $resource->toArray(new Request);

        $matchesPattern = false;
        foreach ($validPatterns as $pattern) {
            if (preg_match($pattern, $result['created_at_human'])) {
                $matchesPattern = true;
                break;
            }
        }

        $this->assertTrue($matchesPattern, "created_at_human '{$result['created_at_human']}' doesn't match any expected format");
    }

    public function test_timestamps_are_iso8601_format(): void
    {
        $user = User::factory()->create();

        $notification = Notification::create([
            'user_id' => $user->id,
            'type' => 'test',
            'title' => 'Test',
            'message' => 'Test',
        ]);

        $resource = new NotificationResource($notification);
        $result = $resource->toArray(new Request);

        // Check that created_at is ISO 8601 format (contains 'T')
        $this->assertStringContainsString('T', $result['created_at']);
        $this->assertStringContainsString('T', $result['updated_at']);
    }
}

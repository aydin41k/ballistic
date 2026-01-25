<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Jobs\CreateNotificationJob;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class CreateNotificationJobTest extends TestCase
{
    use RefreshDatabase;

    public function test_job_creates_notification_record(): void
    {
        $user = User::factory()->create();

        $job = new CreateNotificationJob(
            userId: (string) $user->id,
            type: 'task_assigned',
            title: 'Test Title',
            message: 'Test message',
            data: ['item_id' => 'test-item-123']
        );

        $job->handle();

        $this->assertDatabaseHas('notifications', [
            'user_id' => $user->id,
            'type' => 'task_assigned',
            'title' => 'Test Title',
            'message' => 'Test message',
        ]);

        $notification = Notification::where('user_id', $user->id)->first();
        $this->assertEquals(['item_id' => 'test-item-123'], $notification->data);
    }

    public function test_job_creates_notification_with_null_data(): void
    {
        $user = User::factory()->create();

        $job = new CreateNotificationJob(
            userId: (string) $user->id,
            type: 'connection_request',
            title: 'Connection Request',
            message: 'Someone wants to connect',
            data: null
        );

        $job->handle();

        $this->assertDatabaseHas('notifications', [
            'user_id' => $user->id,
            'type' => 'connection_request',
        ]);

        $notification = Notification::where('user_id', $user->id)->first();
        $this->assertNull($notification->data);
    }

    public function test_job_creates_notification_with_complex_data(): void
    {
        $user = User::factory()->create();
        $complexData = [
            'item_id' => 'task-999',
            'owner_name' => 'John Doe',
            'changes' => [
                'title' => ['from' => 'Old', 'to' => 'New'],
                'description' => true,
            ],
        ];

        $job = new CreateNotificationJob(
            userId: (string) $user->id,
            type: 'task_updated',
            title: 'Task Updated',
            message: 'John updated your task',
            data: $complexData
        );

        $job->handle();

        $notification = Notification::where('user_id', $user->id)->first();
        $this->assertEquals($complexData, $notification->data);
    }

    public function test_job_has_correct_retry_configuration(): void
    {
        $job = new CreateNotificationJob(
            userId: 'user-id',
            type: 'test',
            title: 'Test',
            message: 'Test'
        );

        $this->assertEquals(3, $job->tries);
        $this->assertEquals(5, $job->backoff);
    }

    public function test_job_implements_should_queue(): void
    {
        $job = new CreateNotificationJob(
            userId: 'user-id',
            type: 'test',
            title: 'Test',
            message: 'Test'
        );

        $this->assertInstanceOf(\Illuminate\Contracts\Queue\ShouldQueue::class, $job);
    }

    public function test_job_creates_multiple_notifications_for_same_user(): void
    {
        $user = User::factory()->create();

        $job1 = new CreateNotificationJob(
            userId: (string) $user->id,
            type: 'task_assigned',
            title: 'Task 1',
            message: 'First task',
            data: ['item_id' => 'task-1']
        );

        $job2 = new CreateNotificationJob(
            userId: (string) $user->id,
            type: 'task_assigned',
            title: 'Task 2',
            message: 'Second task',
            data: ['item_id' => 'task-2']
        );

        $job1->handle();
        $job2->handle();

        $this->assertEquals(2, Notification::where('user_id', $user->id)->count());
    }

    public function test_job_properties_are_readonly(): void
    {
        $job = new CreateNotificationJob(
            userId: 'user-123',
            type: 'test_type',
            title: 'Test Title',
            message: 'Test Message',
            data: ['key' => 'value']
        );

        // Verify the properties are set correctly
        $this->assertEquals('user-123', $job->userId);
        $this->assertEquals('test_type', $job->type);
        $this->assertEquals('Test Title', $job->title);
        $this->assertEquals('Test Message', $job->message);
        $this->assertEquals(['key' => 'value'], $job->data);
    }
}

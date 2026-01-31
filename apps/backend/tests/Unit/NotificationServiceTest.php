<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Contracts\NotificationServiceInterface;
use App\Jobs\CreateNotificationJob;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Bus;
use Tests\TestCase;

final class NotificationServiceTest extends TestCase
{
    use RefreshDatabase;

    private NotificationServiceInterface $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new NotificationService;
    }

    public function test_service_implements_interface(): void
    {
        $this->assertInstanceOf(NotificationServiceInterface::class, $this->service);
    }

    public function test_notify_task_assignment_dispatches_job(): void
    {
        Bus::fake();

        $user = User::factory()->create(['name' => 'Test User']);

        $this->service->notifyTaskAssignment(
            assignee: $user,
            taskId: 'task-123',
            taskTitle: 'Test Task',
            assignerName: 'John Doe'
        );

        Bus::assertDispatched(CreateNotificationJob::class, function ($job) use ($user) {
            return $job->userId === (string) $user->id
                && $job->type === 'task_assigned'
                && $job->title === 'New Task Assigned'
                && $job->message === 'John Doe assigned you a task: Test Task'
                && $job->data['item_id'] === 'task-123'
                && $job->data['assigner_name'] === 'John Doe';
        });
    }

    public function test_notify_task_unassigned_dispatches_job(): void
    {
        Bus::fake();

        $user = User::factory()->create(['name' => 'Test User']);

        $this->service->notifyTaskUnassigned(
            previousAssignee: $user,
            taskId: 'task-456',
            taskTitle: 'Unassigned Task',
            ownerName: 'Jane Smith'
        );

        Bus::assertDispatched(CreateNotificationJob::class, function ($job) use ($user) {
            return $job->userId === (string) $user->id
                && $job->type === 'task_unassigned'
                && $job->title === 'Task Unassigned'
                && $job->message === 'Jane Smith removed your assignment from: Unassigned Task'
                && $job->data['item_id'] === 'task-456'
                && $job->data['owner_name'] === 'Jane Smith';
        });
    }

    public function test_notify_task_updated_dispatches_job(): void
    {
        Bus::fake();

        $user = User::factory()->create(['name' => 'Test User']);
        $changes = ['title' => ['from' => 'Old Title', 'to' => 'New Title']];

        $this->service->notifyTaskUpdated(
            assignee: $user,
            taskId: 'task-789',
            taskTitle: 'Updated Task',
            ownerName: 'Bob Johnson',
            changes: $changes
        );

        Bus::assertDispatched(CreateNotificationJob::class, function ($job) use ($user, $changes) {
            return $job->userId === (string) $user->id
                && $job->type === 'task_updated'
                && $job->title === 'Task Updated'
                && $job->message === 'Bob Johnson updated the task: Updated Task'
                && $job->data['item_id'] === 'task-789'
                && $job->data['owner_name'] === 'Bob Johnson'
                && $job->data['changes'] === $changes;
        });
    }

    public function test_notify_task_completed_dispatches_job_for_done_status(): void
    {
        Bus::fake();

        $user = User::factory()->create(['name' => 'Test User']);

        $this->service->notifyTaskCompleted(
            assignee: $user,
            taskId: 'task-abc',
            taskTitle: 'Completed Task',
            ownerName: 'Alice Cooper',
            newStatus: 'done'
        );

        Bus::assertDispatched(CreateNotificationJob::class, function ($job) use ($user) {
            return $job->userId === (string) $user->id
                && $job->type === 'task_completed'
                && $job->title === 'Task Completed'
                && $job->message === 'Alice Cooper completed: Completed Task'
                && $job->data['item_id'] === 'task-abc'
                && $job->data['new_status'] === 'done';
        });
    }

    public function test_notify_task_completed_dispatches_job_for_wontdo_status(): void
    {
        Bus::fake();

        $user = User::factory()->create(['name' => 'Test User']);

        $this->service->notifyTaskCompleted(
            assignee: $user,
            taskId: 'task-def',
            taskTitle: 'Cancelled Task',
            ownerName: 'Eve Black',
            newStatus: 'wontdo'
        );

        Bus::assertDispatched(CreateNotificationJob::class, function ($job) use ($user) {
            return $job->userId === (string) $user->id
                && $job->type === 'task_completed'
                && $job->title === 'Task Completed'
                && str_contains($job->message, "marked as won't do")
                && $job->data['new_status'] === 'wontdo';
        });
    }

    public function test_notify_connection_request_dispatches_job(): void
    {
        Bus::fake();

        $user = User::factory()->create(['name' => 'Test User']);

        $this->service->notifyConnectionRequest(
            addressee: $user,
            requesterName: 'Charlie Brown'
        );

        Bus::assertDispatched(CreateNotificationJob::class, function ($job) use ($user) {
            return $job->userId === (string) $user->id
                && $job->type === 'connection_request'
                && $job->title === 'Connection Request'
                && $job->message === 'Charlie Brown wants to connect with you'
                && $job->data['requester_name'] === 'Charlie Brown';
        });
    }

    public function test_notify_connection_accepted_dispatches_job(): void
    {
        Bus::fake();

        $user = User::factory()->create(['name' => 'Test User']);

        $this->service->notifyConnectionAccepted(
            requester: $user,
            addresseeName: 'Diana Prince'
        );

        Bus::assertDispatched(CreateNotificationJob::class, function ($job) use ($user) {
            return $job->userId === (string) $user->id
                && $job->type === 'connection_accepted'
                && $job->title === 'Connection Accepted'
                && $job->message === 'Diana Prince accepted your connection request'
                && $job->data['addressee_name'] === 'Diana Prince';
        });
    }

    public function test_multiple_notifications_dispatch_multiple_jobs(): void
    {
        Bus::fake();

        $user1 = User::factory()->create();
        $user2 = User::factory()->create();

        $this->service->notifyTaskAssignment($user1, 'task-1', 'Task 1', 'Owner 1');
        $this->service->notifyTaskAssignment($user2, 'task-2', 'Task 2', 'Owner 2');
        $this->service->notifyConnectionRequest($user1, 'Requester');

        Bus::assertDispatchedTimes(CreateNotificationJob::class, 3);
    }

    public function test_job_is_queued_with_correct_properties(): void
    {
        Bus::fake();

        $user = User::factory()->create();

        $this->service->notifyTaskAssignment($user, 'task-id', 'Task Title', 'Assigner');

        Bus::assertDispatched(CreateNotificationJob::class, function ($job) {
            // Verify job has retry properties
            $this->assertEquals(3, $job->tries);
            $this->assertEquals(5, $job->backoff);

            return true;
        });
    }
}

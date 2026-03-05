<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Contracts\NotificationServiceInterface;
use App\Http\Resources\NotificationResource;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;

final class NotificationController extends Controller
{
    public function __construct(
        private readonly NotificationServiceInterface $notificationService
    ) {}

    /**
     * Notification feed for the authenticated user.
     *
     * Cursor-paginated so the Notification Centre can load history
     * indefinitely without OFFSET scans. The existing composite index
     * (user_id, read_at) covers the unread_only filter, and the created_at
     * index covers the ordering.
     *
     * Query params:
     *   ?unread_only=1    — limit to unread
     *   ?cursor=...       — infinite-scroll continuation
     *   ?per_page=n       — page size (clamped to 100)
     *
     * Back-compat: clients that don't pass a cursor get a simple first page,
     * so existing poll-based callers continue to work unchanged.
     */
    public function index(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = Auth::user();

        $perPage = min((int) $request->integer('per_page', 50), 100);

        $query = $user->taskNotifications()
            ->orderByDesc('created_at')
            ->orderByDesc('id');

        if ($request->boolean('unread_only')) {
            $query->whereNull('read_at');
        }

        $paginated = $query->cursorPaginate($perPage);

        return response()->json([
            'data' => NotificationResource::collection($paginated->items()),
            'next_cursor' => $paginated->nextCursor()?->encode(),
            'has_more' => $paginated->hasMorePages(),
            'unread_count' => $this->notificationService->getUnreadCount($user),
        ]);
    }

    /**
     * Mark a specific notification as read.
     */
    public function markAsRead(Notification $notification): JsonResponse
    {
        if ((string) $notification->user_id !== (string) Auth::id()) {
            return response()->json(['message' => 'Forbidden'], Response::HTTP_FORBIDDEN);
        }

        $notification->markAsRead();

        return response()->json([
            'message' => 'Notification marked as read.',
            'unread_count' => $this->notificationService->getUnreadCount(Auth::user()),
        ]);
    }

    /**
     * Mark all notifications as read for the authenticated user.
     */
    public function markAllAsRead(): JsonResponse
    {
        $count = $this->notificationService->markAsRead(Auth::user());

        return response()->json([
            'message' => 'All notifications marked as read.',
            'marked_count' => $count,
            'unread_count' => 0,
        ]);
    }

    /**
     * Permanently delete all *read* notifications for the authenticated user.
     * Unread notifications are untouched so the user can't accidentally lose
     * unseen alerts via this bulk action.
     */
    public function clearRead(): JsonResponse
    {
        /** @var User $user */
        $user = Auth::user();

        $deleted = $user->taskNotifications()
            ->whereNotNull('read_at')
            ->delete();

        return response()->json([
            'message' => 'Read notifications cleared.',
            'deleted_count' => $deleted,
            'unread_count' => $this->notificationService->getUnreadCount($user),
        ]);
    }
}

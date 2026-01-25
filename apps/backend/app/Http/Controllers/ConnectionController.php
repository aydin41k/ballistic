<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Contracts\NotificationServiceInterface;
use App\Models\Connection;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;

final class ConnectionController extends Controller
{
    public function __construct(
        private readonly NotificationServiceInterface $notificationService
    ) {}

    /**
     * List all connections for the authenticated user.
     */
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();
        $status = $request->query('status');

        // Get accepted connections (both directions)
        $connections = collect();

        if ($status === null || $status === 'accepted') {
            $connections = $user->connections()->map(fn ($connectedUser) => [
                'id' => $connectedUser->id,
                'name' => $connectedUser->name,
                'email_masked' => $this->maskEmail($connectedUser->email),
                'status' => 'accepted',
            ]);
        }

        // Get pending requests received
        $pendingReceived = collect();
        if ($status === null || $status === 'pending') {
            $pendingReceived = $user->receivedConnectionRequests()
                ->where('status', 'pending')
                ->with('requester')
                ->get()
                ->map(fn ($conn) => [
                    'connection_id' => $conn->id,
                    'id' => $conn->requester->id,
                    'name' => $conn->requester->name,
                    'email_masked' => $this->maskEmail($conn->requester->email),
                    'status' => 'pending_received',
                ]);
        }

        // Get pending requests sent
        $pendingSent = collect();
        if ($status === null || $status === 'pending') {
            $pendingSent = $user->sentConnectionRequests()
                ->where('status', 'pending')
                ->with('addressee')
                ->get()
                ->map(fn ($conn) => [
                    'connection_id' => $conn->id,
                    'id' => $conn->addressee->id,
                    'name' => $conn->addressee->name,
                    'email_masked' => $this->maskEmail($conn->addressee->email),
                    'status' => 'pending_sent',
                ]);
        }

        return response()->json([
            'data' => $connections->merge($pendingReceived)->merge($pendingSent)->values(),
        ]);
    }

    /**
     * Send a connection request to another user.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'user_id' => ['required', 'uuid', 'exists:users,id'],
        ]);

        $currentUser = Auth::user();
        $targetUserId = $validated['user_id'];

        // Cannot connect with yourself
        if ((string) $currentUser->id === (string) $targetUserId) {
            return response()->json(
                ['message' => 'You cannot send a connection request to yourself.'],
                Response::HTTP_UNPROCESSABLE_ENTITY
            );
        }

        // Check if connection already exists (either direction)
        $existingConnection = Connection::where(function ($query) use ($currentUser, $targetUserId) {
            $query->where('requester_id', $currentUser->id)
                ->where('addressee_id', $targetUserId);
        })->orWhere(function ($query) use ($currentUser, $targetUserId) {
            $query->where('requester_id', $targetUserId)
                ->where('addressee_id', $currentUser->id);
        })->first();

        if ($existingConnection !== null) {
            if ($existingConnection->isAccepted()) {
                return response()->json(
                    ['message' => 'You are already connected with this user.'],
                    Response::HTTP_CONFLICT
                );
            }

            if ($existingConnection->isPending()) {
                // If they sent us a request, accept it instead
                if ((string) $existingConnection->requester_id === (string) $targetUserId) {
                    $existingConnection->accept();

                    return response()->json([
                        'message' => 'Connection request accepted.',
                        'connection' => [
                            'id' => $existingConnection->addressee->id,
                            'name' => $existingConnection->addressee->name,
                            'status' => 'accepted',
                        ],
                    ]);
                }

                return response()->json(
                    ['message' => 'A connection request is already pending.'],
                    Response::HTTP_CONFLICT
                );
            }

            // If previously declined, allow new request
            $existingConnection->delete();
        }

        // Create new connection request
        $connection = Connection::create([
            'requester_id' => $currentUser->id,
            'addressee_id' => $targetUserId,
            'status' => 'pending',
        ]);

        // Notify the target user
        $targetUser = User::find($targetUserId);
        $this->notificationService->notifyConnectionRequest($targetUser, $currentUser->name);

        return response()->json([
            'message' => 'Connection request sent.',
            'connection' => [
                'connection_id' => $connection->id,
                'id' => $targetUser->id,
                'name' => $targetUser->name,
                'status' => 'pending_sent',
            ],
        ], Response::HTTP_CREATED);
    }

    /**
     * Accept a connection request.
     */
    public function accept(Connection $connection): JsonResponse
    {
        $currentUser = Auth::user();

        // Only the addressee can accept
        if ((string) $connection->addressee_id !== (string) $currentUser->id) {
            return response()->json(
                ['message' => 'You can only accept requests sent to you.'],
                Response::HTTP_FORBIDDEN
            );
        }

        if (! $connection->isPending()) {
            return response()->json(
                ['message' => 'This connection request is no longer pending.'],
                Response::HTTP_UNPROCESSABLE_ENTITY
            );
        }

        $connection->accept();

        // Notify the requester
        $this->notificationService->notifyConnectionAccepted(
            $connection->requester,
            $currentUser->name
        );

        return response()->json([
            'message' => 'Connection accepted.',
            'connection' => [
                'id' => $connection->requester->id,
                'name' => $connection->requester->name,
                'status' => 'accepted',
            ],
        ]);
    }

    /**
     * Decline a connection request.
     */
    public function decline(Connection $connection): JsonResponse
    {
        $currentUser = Auth::user();

        // Only the addressee can decline
        if ((string) $connection->addressee_id !== (string) $currentUser->id) {
            return response()->json(
                ['message' => 'You can only decline requests sent to you.'],
                Response::HTTP_FORBIDDEN
            );
        }

        if (! $connection->isPending()) {
            return response()->json(
                ['message' => 'This connection request is no longer pending.'],
                Response::HTTP_UNPROCESSABLE_ENTITY
            );
        }

        $connection->decline();

        return response()->json([
            'message' => 'Connection declined.',
        ]);
    }

    /**
     * Remove an existing connection.
     */
    public function destroy(Connection $connection): JsonResponse
    {
        $currentUser = Auth::user();

        // Either party can remove the connection
        $isInvolved = (string) $connection->requester_id === (string) $currentUser->id
            || (string) $connection->addressee_id === (string) $currentUser->id;

        if (! $isInvolved) {
            return response()->json(
                ['message' => 'You are not part of this connection.'],
                Response::HTTP_FORBIDDEN
            );
        }

        $connection->delete();

        return response()->json(null, Response::HTTP_NO_CONTENT);
    }

    /**
     * Mask an email address for privacy.
     */
    private function maskEmail(string $email): string
    {
        $parts = explode('@', $email);
        if (count($parts) !== 2) {
            return $email;
        }

        $local = $parts[0];
        $domain = $parts[1];

        $maskedLocal = strlen($local) > 1
            ? $local[0].'***'
            : $local.'***';

        return $maskedLocal.'@'.$domain;
    }
}

<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\McpTokenService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class McpTokenController extends Controller
{
    public function __construct(
        private readonly McpTokenService $mcpTokens
    ) {}

    public function index(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $tokens = $this->mcpTokens
            ->listTokens($user)
            ->map(fn ($token) => $this->mcpTokens->toPayload($token))
            ->all();

        return response()->json([
            'data' => $tokens,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
        ]);

        /** @var User $user */
        $user = $request->user();
        $newToken = $this->mcpTokens->createToken($user, $validated['name']);

        return response()->json([
            'data' => [
                'token' => $newToken->plainTextToken,
                'token_record' => $this->mcpTokens->toPayload($newToken->accessToken),
            ],
        ], 201);
    }

    public function destroy(Request $request, string $tokenId): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        if (! $this->mcpTokens->revokeToken($user, $tokenId)) {
            return response()->json([
                'message' => 'Token not found.',
            ], 404);
        }

        return response()->json([
            'message' => 'Token revoked successfully.',
        ], 200);
    }
}

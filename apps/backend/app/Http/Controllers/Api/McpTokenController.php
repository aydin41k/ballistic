<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreMcpTokenRequest;
use App\Http\Resources\McpTokenResource;
use App\Models\User;
use App\Services\McpTokenService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

final class McpTokenController extends Controller
{
    public function __construct(
        private readonly McpTokenService $mcpTokens
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        /** @var User $user */
        $user = $request->user();

        return McpTokenResource::collection($this->mcpTokens->listTokens($user));
    }

    public function store(StoreMcpTokenRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $newToken = $this->mcpTokens->createToken($user, $request->validated('name'));

        return response()->json([
            'data' => [
                'token' => $newToken->plainTextToken,
                'token_record' => new McpTokenResource($newToken->accessToken),
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
        ]);
    }
}

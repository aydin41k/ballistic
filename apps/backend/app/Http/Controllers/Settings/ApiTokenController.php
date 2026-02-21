<?php

declare(strict_types=1);

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Resources\McpTokenResource;
use App\Models\User;
use App\Services\McpTokenService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class ApiTokenController extends Controller
{
    public function __construct(
        private readonly McpTokenService $mcpTokens
    ) {}

    /**
     * Show the API tokens management page.
     */
    public function index(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();
        $tokens = McpTokenResource::collection($this->mcpTokens->listTokens($user));

        return Inertia::render('settings/api-tokens', [
            'tokens' => $tokens,
        ]);
    }

    /**
     * Create a new API token.
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
        ]);

        /** @var User $user */
        $user = $request->user();
        $token = $this->mcpTokens->createToken($user, $request->name);

        return back()->with('newToken', $token->plainTextToken);
    }

    /**
     * Revoke an API token.
     */
    public function destroy(Request $request, string $tokenId): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        $revoked = $this->mcpTokens->revokeToken($user, $tokenId);

        return $revoked
            ? back()->with('status', 'Token revoked successfully.')
            : back()->with('status', 'Token not found.');
    }
}

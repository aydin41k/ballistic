<?php

declare(strict_types=1);

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class ApiTokenController extends Controller
{
    /**
     * Show the API tokens management page.
     */
    public function index(Request $request): Response
    {
        return Inertia::render('settings/api-tokens', [
            'tokens' => $request->user()->tokens->map(fn ($token) => [
                'id' => $token->id,
                'name' => $token->name,
                'created_at' => $token->created_at->toIso8601String(),
                'last_used_at' => $token->last_used_at?->toIso8601String(),
            ]),
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

        $token = $request->user()->createToken($request->name);

        return back()->with('newToken', $token->plainTextToken);
    }

    /**
     * Revoke an API token.
     */
    public function destroy(Request $request, string $tokenId): RedirectResponse
    {
        $request->user()->tokens()->where('id', $tokenId)->delete();

        return back()->with('status', 'Token revoked successfully.');
    }
}

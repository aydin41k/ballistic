<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Auth\TokenAbility;
use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Services\GoogleAuthService;
use Illuminate\Auth\Events\Login;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Throwable;

final class GoogleAuthController extends Controller
{
    public function redirect(Request $request, GoogleAuthService $googleAuth): JsonResponse
    {
        $validated = $request->validate([
            'client' => ['required', Rule::in(['web', 'mobile'])],
            'device_name' => ['nullable', 'string', 'max:255'],
        ]);

        try {
            $url = $googleAuth->authorisationUrl(
                $validated['client'],
                $validated['device_name'] ?? 'Google sign-in',
            );
        } catch (Throwable $exception) {
            report($exception);

            throw ValidationException::withMessages([
                'google' => ['Google sign-in is not available right now.'],
            ]);
        }

        return response()->json(['url' => $url]);
    }

    public function callback(Request $request, GoogleAuthService $googleAuth): RedirectResponse
    {
        $state = $googleAuth->consumeState($request->query('state'));

        if ($state === null) {
            return redirect()->away($googleAuth->callbackUrl('web', 'error', 'invalid_state'));
        }

        if ($request->filled('error')) {
            return redirect()->away($googleAuth->callbackUrl($state['client'], 'error', 'cancelled'));
        }

        try {
            $user = $googleAuth->authenticate($googleAuth->userFromGoogle());
            $code = $googleAuth->createExchangeCode($user, $state['device_name']);

            return redirect()->away($googleAuth->callbackUrl($state['client'], 'code', $code));
        } catch (Throwable $exception) {
            if (! $exception instanceof ValidationException) {
                report($exception);
            }

            Log::notice('Google sign-in callback failed.', ['exception' => $exception::class]);

            return redirect()->away($googleAuth->callbackUrl($state['client'], 'error', 'authentication_failed'));
        }
    }

    public function exchange(Request $request, GoogleAuthService $googleAuth): JsonResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'size:64'],
        ]);
        $exchange = $googleAuth->consumeExchangeCode($validated['code']);

        if ($exchange === null) {
            throw ValidationException::withMessages([
                'code' => ['This Google sign-in has expired or has already been used.'],
            ]);
        }

        $token = $exchange['user']->createToken(
            $exchange['device_name'],
            [TokenAbility::Api->value],
        )->plainTextToken;

        event(new Login('sanctum', $exchange['user'], false));

        return response()->json([
            'message' => 'Login successful',
            'user' => new UserResource($exchange['user']),
            'token' => $token,
        ]);
    }
}

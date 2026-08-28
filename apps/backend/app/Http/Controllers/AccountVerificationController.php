<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\HumanCheckService;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Symfony\Component\HttpFoundation\Response;

final class AccountVerificationController extends Controller
{
    public function show(Request $request, User $user, string $channel, string $hash): InertiaResponse|Response
    {
        $this->ensureLinkMatches($user, $channel, $hash);

        if ($user->account_verified_at !== null) {
            return $this->successRedirect($request);
        }

        return Inertia::render('auth/account-verification', [
            'actionUrl' => $request->fullUrl(),
            'siteKey' => config('services.turnstile.site_key'),
            'channel' => $channel,
        ]);
    }

    public function verify(
        Request $request,
        User $user,
        string $channel,
        string $hash,
        HumanCheckService $humanCheckService,
    ): Response {
        $this->ensureLinkMatches($user, $channel, $hash);

        if ($user->account_verified_at !== null) {
            return $this->successRedirect($request);
        }

        $responseToken = $request->string('cf-turnstile-response')->value();
        if (! $humanCheckService->verify($responseToken, $request->ip())) {
            throw ValidationException::withMessages([
                'human_check' => ['The human check was not completed. Please try again.'],
            ]);
        }

        $verifiedAt = Carbon::now();
        $user->forceFill([
            'account_verified_at' => $verifiedAt,
            'email_verified_at' => $channel === 'email' ? $verifiedAt : $user->email_verified_at,
            'phone_verified_at' => $channel === 'sms' ? $verifiedAt : $user->phone_verified_at,
        ])->save();

        return $this->successRedirect($request);
    }

    private function ensureLinkMatches(User $user, string $channel, string $hash): void
    {
        abort_unless(in_array($channel, ['email', 'sms'], true), 404);

        $destination = $channel === 'sms' ? $user->phone : $user->email;
        abort_unless(is_string($destination) && hash_equals(sha1($destination), $hash), 403);
    }

    private function successRedirect(Request $request): Response
    {
        $url = $request->query('client') === 'mobile'
            ? rtrim((string) config('app.mobile_url'), '/').'?verified=1'
            : rtrim((string) config('app.frontend_url'), '/').'/login?verified=1';

        if ($request->header('X-Inertia') !== null) {
            return Inertia::location($url);
        }

        return redirect()->away($url);
    }
}

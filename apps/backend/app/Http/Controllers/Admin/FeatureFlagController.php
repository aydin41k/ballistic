<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateFeatureFlagRequest;
use App\Http\Resources\FeatureFlagResource;
use App\Models\AuditLog;
use App\Models\FeatureFlag;
use App\Services\FeatureFlagService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

final class FeatureFlagController extends Controller
{
    /**
     * Render the admin toggle grid.
     */
    public function index(FeatureFlagService $flags): InertiaResponse
    {
        return Inertia::render('admin/feature-flags/index', [
            'flags' => FeatureFlagResource::collection($flags->adminList()),
        ]);
    }

    /**
     * Toggle or upsert a flag. The key comes from the route segment so the
     * admin UI can PATCH flags that do not yet exist in the DB (auto-create).
     */
    public function update(
        UpdateFeatureFlagRequest $request,
        FeatureFlagService $flags,
        string $key
    ): RedirectResponse {
        abort_unless($this->isValidKey($key), 422, 'Invalid feature flag key.');

        $previous = FeatureFlag::query()->find($key)?->enabled;

        $flag = $flags->set(
            key: $key,
            enabled: $request->boolean('enabled'),
            label: $request->validated('label')
                ?? (FeatureFlag::query()->find($key) ? null : Str::headline($key)),
            description: $request->validated('description'),
        );

        AuditLog::create([
            'user_id' => $request->user()->id,
            'action' => 'feature_flag_updated',
            'resource_type' => 'feature_flag',
            'resource_id' => $flag->key,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'status' => 'success',
            'metadata' => [
                'key' => $flag->key,
                'previous' => $previous,
                'enabled' => $flag->enabled,
            ],
        ]);

        return redirect()
            ->route('admin.feature-flags.index')
            ->with('success', sprintf('Flag "%s" %s.', $flag->key, $flag->enabled ? 'enabled' : 'disabled'));
    }

    /**
     * Keys must be snake_case identifiers. This guards against path
     * traversal / cache-key pollution when admins hand-craft requests.
     */
    private function isValidKey(string $key): bool
    {
        return (bool) preg_match('/^[a-z][a-z0-9_]{0,63}$/', $key);
    }
}

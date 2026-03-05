<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\UpdateProfileRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

final class UserController extends Controller
{
    /**
     * Display the authenticated user's profile.
     */
    public function show(Request $request): UserResource
    {
        /** @var User $user */
        $user = $request->user();
        $user->load(['favourites', 'excludedProjects:id']);

        return new UserResource($user);
    }

    /**
     * Update the authenticated user's profile.
     *
     * Handles:
     *  - Scalar profile fields (name, email, phone, notes)
     *  - Per-user feature_flags (partial merge, allowlist-enforced)
     *  - Avatar upload (stored on the public disk; previous file is removed)
     *  - Project exclusion sync (pivot table)
     *  - Password change
     *
     * All mutations run in a single transaction so a failure mid-way (e.g.
     * pivot sync constraint violation) does not leave the row partially
     * updated.
     */
    public function update(UpdateProfileRequest $request): UserResource
    {
        /** @var User $user */
        $user = $request->user();
        $validated = $request->validated();

        if (isset($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        }

        if (array_key_exists('feature_flags', $validated) && is_array($validated['feature_flags'])) {
            $incoming = array_intersect_key(
                $validated['feature_flags'],
                array_flip(UpdateProfileRequest::allowedFeatureFlagKeys())
            );
            $validated['feature_flags'] = array_merge($user->feature_flags ?? [], $incoming);
        }

        // Pop non-column inputs before mass-assign.
        $excludedProjectIds = $validated['excluded_project_ids'] ?? null;
        unset($validated['excluded_project_ids'], $validated['avatar']);

        $oldAvatarPath = null;

        if ($request->hasFile('avatar')) {
            // Store first so a transaction rollback doesn't leave an orphan
            // DB row without a file. If the DB write fails we delete the
            // newly stored file in the catch below.
            $newPath = $request->file('avatar')->store('avatars', 'public');
            $oldAvatarPath = $user->avatar_path;
            $validated['avatar_path'] = $newPath;
        }

        // Capture BEFORE update() — update() syncs the model's `original`
        // attribute snapshot, so getOriginal('email') would return the new
        // value if we checked afterwards.
        $emailWillChange = isset($validated['email'])
            && $validated['email'] !== $user->email;

        try {
            DB::transaction(function () use ($user, $validated, $excludedProjectIds, $emailWillChange): void {
                $user->update($validated);

                if ($emailWillChange) {
                    $user->email_verified_at = null;
                    $user->save();
                }

                if ($excludedProjectIds !== null) {
                    // sync() fully replaces the set: absent IDs are detached,
                    // new IDs attached, existing ones untouched.
                    $user->excludedProjects()->sync($excludedProjectIds);
                }
            });
        } catch (\Throwable $e) {
            // Roll back the uploaded file if the DB write failed.
            if (isset($validated['avatar_path'])) {
                Storage::disk('public')->delete($validated['avatar_path']);
            }
            throw $e;
        }

        // Only remove the old avatar after a successful commit so we never
        // lose the user's previous image on a transient DB failure.
        if ($oldAvatarPath !== null && $oldAvatarPath !== ($validated['avatar_path'] ?? null)) {
            Storage::disk('public')->delete($oldAvatarPath);
        }

        $user->load(['favourites', 'excludedProjects:id']);

        return new UserResource($user);
    }
}

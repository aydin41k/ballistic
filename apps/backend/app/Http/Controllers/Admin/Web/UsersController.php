<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin\Web;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\AdminUserService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

final class UsersController extends Controller
{
    public function __construct(
        private readonly AdminUserService $adminUserService,
    ) {}

    /**
     * Display paginated, searchable user listing.
     */
    public function index(Request $request): Response
    {
        $search = $request->string('search')->trim()->value();
        $roleFilter = $request->query('role');

        $query = User::query()
            ->withCount(['items', 'projects', 'tags'])
            ->orderBy('created_at', 'desc');

        if (mb_strlen($search) >= 2) {
            $query->where(function (Builder $q) use ($search): void {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        if ($roleFilter === 'admin') {
            $query->where('is_admin', true);
        } elseif ($roleFilter === 'user') {
            $query->where('is_admin', false);
        }

        $users = $query->paginate(25)->withQueryString();

        return Inertia::render('admin/users/index', [
            'users' => $users,
            'filters' => [
                'search' => $search,
                'role' => $roleFilter,
            ],
        ]);
    }

    /**
     * Display a user's full collaboration history.
     */
    public function show(User $user): Response
    {
        $user->loadCount(['items', 'projects', 'tags', 'taskNotifications']);

        // Collaboration: items assigned to this user with project and owner context
        $assignedItems = $user->assignedItems()
            ->select(['id', 'title', 'status', 'project_id', 'user_id', 'completed_at', 'created_at'])
            ->with([
                'project:id,name,color',
                'user:id,name,email',
            ])
            ->latest()
            ->limit(50)
            ->get();

        // Items this user delegated to others
        $delegatedItems = $user->items()
            ->whereNotNull('assignee_id')
            ->select(['id', 'title', 'status', 'project_id', 'assignee_id', 'completed_at', 'created_at'])
            ->with([
                'project:id,name,color',
                'assignee:id,name,email',
            ])
            ->latest()
            ->limit(50)
            ->get();

        // Shared lists (projects with items created by or assigned to other users)
        $sharedProjects = $user->projects()
            ->withCount('items')
            ->with(['items' => fn ($q) => $q->whereNotNull('assignee_id')->select(['id', 'project_id', 'assignee_id'])->with('assignee:id,name')])
            ->latest()
            ->limit(20)
            ->get();

        return Inertia::render('admin/users/show', [
            'user' => $user,
            'assigned_items' => $assignedItems,
            'delegated_items' => $delegatedItems,
            'shared_projects' => $sharedProjects,
        ]);
    }

    /**
     * Update user profile or role.
     */
    public function update(Request $request, User $user): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'phone' => ['sometimes', 'nullable', 'string', 'max:20'],
            'notes' => ['sometimes', 'nullable', 'string', 'max:10000'],
            'is_admin' => ['sometimes', 'boolean'],
        ]);

        $isAdminField = isset($validated['is_admin']);

        if ($isAdminField) {
            // Prevent self-demotion — cast both keys to string to handle UUID object vs string
            if ((string) $user->getKey() === (string) $request->user()->getKey() && ! $validated['is_admin']) {
                return back()->withErrors(['is_admin' => 'You cannot remove your own admin privileges.']);
            }

            $this->adminUserService->toggleAdminRole(
                admin: $request->user(),
                target: $user,
                makeAdmin: (bool) $validated['is_admin'],
                ipAddress: $request->ip() ?? '',
                userAgent: $request->userAgent() ?? '',
            );

            unset($validated['is_admin']);
        }

        if (! empty($validated)) {
            $this->adminUserService->updateProfile(
                admin: $request->user(),
                target: $user,
                data: $validated,
                ipAddress: $request->ip() ?? '',
                userAgent: $request->userAgent() ?? '',
            );
        }

        return back()->with('success', 'User updated successfully.');
    }

    /**
     * Hard reset a user's data.
     */
    public function hardReset(Request $request, User $user): RedirectResponse
    {
        // Prevent self-reset — cast both keys to string to handle UUID object vs string
        if ((string) $user->getKey() === (string) $request->user()->getKey()) {
            return back()->withErrors(['hard_reset' => 'You cannot hard reset your own account.']);
        }

        $this->adminUserService->hardReset(
            admin: $request->user(),
            target: $user,
            ipAddress: $request->ip() ?? '',
            userAgent: $request->userAgent() ?? '',
        );

        return back()->with('success', "User {$user->name}'s data has been reset.");
    }

    /**
     * Not used — admins do not create users through the web UI.
     */
    public function create(): never
    {
        abort(404);
    }

    /**
     * Not used.
     */
    public function store(Request $request): never
    {
        abort(404);
    }

    /**
     * Not used — admins do not delete users through the web UI (too destructive without review).
     */
    public function destroy(User $user): never
    {
        abort(404);
    }

    /**
     * Not used.
     */
    public function edit(User $user): never
    {
        abort(404);
    }
}

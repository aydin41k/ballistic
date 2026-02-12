<?php

declare(strict_types=1);

namespace App\Mcp\Services;

use App\Models\AuditLog;
use App\Models\Connection;
use App\Models\Item;
use App\Models\Project;
use App\Models\Tag;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;

/**
 * Context-aware guard for MCP operations.
 *
 * This service ensures that MCP operations are properly scoped to the
 * authenticated user and enforces authorization policies to prevent
 * agents from accessing or modifying other users' data.
 *
 * Key security features:
 * - All queries automatically scoped to authenticated user
 * - ItemPolicy rules enforced for item operations
 * - Connection validation for task assignment
 * - Audit logging of all agent actions
 */
final class McpAuthContext
{
    private ?User $user = null;

    /**
     * Get the authenticated user.
     *
     * @throws \RuntimeException If no user is authenticated
     */
    public function user(): User
    {
        if ($this->user !== null) {
            return $this->user;
        }

        $user = Auth::user();

        if (! $user instanceof User) {
            throw new \RuntimeException('MCP operation requires authenticated user');
        }

        $this->user = $user;

        return $this->user;
    }

    /**
     * Set the user context explicitly (for testing or CLI usage).
     */
    public function setUser(User $user): self
    {
        $this->user = $user;

        return $this;
    }

    /**
     * Check if a user is authenticated.
     */
    public function isAuthenticated(): bool
    {
        return Auth::check() || $this->user !== null;
    }

    /**
     * Get an item by ID, scoped to the authenticated user.
     *
     * Returns items where the user is either the owner or the assignee.
     */
    public function getItem(string $id): ?Item
    {
        $user = $this->user();

        return Item::where('id', $id)
            ->where(function ($query) use ($user): void {
                $query->where('user_id', $user->id)
                    ->orWhere('assignee_id', $user->id);
            })
            ->first();
    }

    /**
     * Get items for the authenticated user with optional filters.
     *
     * @param  array<string, mixed>  $filters
     * @return \Illuminate\Database\Eloquent\Collection<int, Item>
     */
    public function getItems(array $filters = []): \Illuminate\Database\Eloquent\Collection
    {
        $user = $this->user();

        $query = Item::query();

        // Apply base scope: owned items OR assigned items
        if ($filters['assigned_to_me'] ?? false) {
            // Only items assigned to the user by others
            $query->where('assignee_id', $user->id)
                ->where('user_id', '!=', $user->id);
        } elseif ($filters['delegated'] ?? false) {
            // Only items the user owns but has assigned to others
            $query->where('user_id', $user->id)
                ->whereNotNull('assignee_id');
        } else {
            // All items the user can see (owned or assigned)
            $query->where(function ($q) use ($user): void {
                $q->where('user_id', $user->id)
                    ->orWhere('assignee_id', $user->id);
            });
        }

        // Apply scope filter (active, planned, or all)
        if (isset($filters['scope'])) {
            match ($filters['scope']) {
                'active' => $query->active(),
                'planned' => $query->planned(),
                default => null, // 'all' - no additional filter
            };
        }

        // Filter by status
        if (isset($filters['status'])) {
            $statuses = is_array($filters['status']) ? $filters['status'] : [$filters['status']];
            $query->whereIn('status', $statuses);
        }

        // Filter by project
        if (isset($filters['project_id'])) {
            if ($filters['project_id'] === 'inbox') {
                $query->whereNull('project_id');
            } else {
                $query->where('project_id', $filters['project_id']);
            }
        }

        // Filter by tag
        if (isset($filters['tag_id'])) {
            $query->whereHas('tags', fn ($q) => $q->where('tags.id', $filters['tag_id']));
        }

        // Filter by date range
        if (isset($filters['scheduled_from'])) {
            $query->where('scheduled_date', '>=', $filters['scheduled_from']);
        }
        if (isset($filters['scheduled_to'])) {
            $query->where('scheduled_date', '<=', $filters['scheduled_to']);
        }
        if (isset($filters['due_from'])) {
            $query->where('due_date', '>=', $filters['due_from']);
        }
        if (isset($filters['due_to'])) {
            $query->where('due_date', '<=', $filters['due_to']);
        }

        // Search by title/description (case-insensitive, database-agnostic)
        if (isset($filters['search'])) {
            // Escape LIKE special characters to prevent pattern injection
            // Use '!' as escape character for cross-database compatibility
            $escapedSearch = str_replace(['!', '%', '_'], ['!!', '!%', '!_'], $filters['search']);
            $search = '%'.strtolower($escapedSearch).'%';
            $query->where(function ($q) use ($search): void {
                $q->whereRaw("LOWER(title) LIKE ? ESCAPE '!'", [$search])
                    ->orWhereRaw("LOWER(description) LIKE ? ESCAPE '!'", [$search]);
            });
        }

        // Apply limit
        $limit = min($filters['limit'] ?? 25, 100);

        return $query
            ->with(['project', 'tags', 'assignee', 'user'])
            ->orderBy('position')
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
    }

    /**
     * Get a project by ID, scoped to the authenticated user.
     */
    public function getProject(string $id): ?Project
    {
        return Project::where('id', $id)
            ->where('user_id', $this->user()->id)
            ->first();
    }

    /**
     * Get projects for the authenticated user.
     *
     * @return \Illuminate\Database\Eloquent\Collection<int, Project>
     */
    public function getProjects(bool $includeArchived = false): \Illuminate\Database\Eloquent\Collection
    {
        $query = Project::where('user_id', $this->user()->id);

        if (! $includeArchived) {
            $query->whereNull('archived_at');
        }

        return $query->orderBy('name')->get();
    }

    /**
     * Get a tag by ID, scoped to the authenticated user.
     */
    public function getTag(string $id): ?Tag
    {
        return Tag::where('id', $id)
            ->where('user_id', $this->user()->id)
            ->first();
    }

    /**
     * Get tags for the authenticated user.
     *
     * @return \Illuminate\Database\Eloquent\Collection<int, Tag>
     */
    public function getTags(): \Illuminate\Database\Eloquent\Collection
    {
        return Tag::where('user_id', $this->user()->id)
            ->orderBy('name')
            ->get();
    }

    /**
     * Get connected users for the authenticated user.
     *
     * @return \Illuminate\Support\Collection<int, User>
     */
    public function getConnectedUsers(): \Illuminate\Support\Collection
    {
        return $this->user()->connections();
    }

    /**
     * Check if a user can be assigned tasks by the authenticated user.
     */
    public function canAssignTo(string $userId): bool
    {
        return $this->user()->isConnectedWith($userId);
    }

    /**
     * Check if the user can view an item.
     */
    public function canViewItem(Item $item): bool
    {
        return Gate::forUser($this->user())->allows('view', $item);
    }

    /**
     * Check if the user can update an item.
     */
    public function canUpdateItem(Item $item): bool
    {
        return Gate::forUser($this->user())->allows('update', $item);
    }

    /**
     * Check if the user can update specific fields on an item.
     *
     * @param  array<string>  $fields
     * @param  array<string, mixed>  $validatedData
     */
    public function canUpdateItemFields(Item $item, array $fields, array $validatedData = []): bool
    {
        return Gate::forUser($this->user())->allows('canAssigneeUpdateFields', [$item, $fields, $validatedData]);
    }

    /**
     * Check if the user can delete an item.
     */
    public function canDeleteItem(Item $item): bool
    {
        return Gate::forUser($this->user())->allows('delete', $item);
    }

    /**
     * Check if the user is the owner of an item.
     */
    public function isItemOwner(Item $item): bool
    {
        return (string) $item->user_id === (string) $this->user()->id;
    }

    /**
     * Log an MCP agent action for audit purposes.
     *
     * @param  array<string, mixed>  $metadata
     */
    public function logAction(
        string $action,
        string $resourceType,
        ?string $resourceId = null,
        string $status = 'success',
        array $metadata = []
    ): void {
        AuditLog::create([
            'user_id' => $this->user()->id,
            'action' => "mcp.{$action}",
            'resource_type' => $resourceType,
            'resource_id' => $resourceId,
            'ip_address' => request()?->ip(),
            'user_agent' => request()?->userAgent() ?? 'MCP Agent',
            'status' => $status,
            'metadata' => array_merge($metadata, [
                'via' => 'mcp',
                'timestamp' => now()->toIso8601String(),
            ]),
        ]);
    }
}

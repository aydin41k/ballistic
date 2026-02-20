<?php

declare(strict_types=1);

namespace App\Mcp\Servers;

use App\Mcp\Resources\ConnectionsResource;
use App\Mcp\Resources\ItemResource;
use App\Mcp\Resources\ItemsResource;
use App\Mcp\Resources\ProjectResource;
use App\Mcp\Resources\ProjectsResource;
use App\Mcp\Resources\TagsResource;
use App\Mcp\Resources\UserProfileResource;
use App\Mcp\Tools\AssignItemTool;
use App\Mcp\Tools\CompleteItemTool;
use App\Mcp\Tools\CreateItemTool;
use App\Mcp\Tools\CreateProjectTool;
use App\Mcp\Tools\CreateTagTool;
use App\Mcp\Tools\DeleteItemTool;
use App\Mcp\Tools\LookupUsersTool;
use App\Mcp\Tools\SearchItemsTool;
use App\Mcp\Tools\UpdateItemTool;
use App\Mcp\Tools\UpdateProjectTool;
use Laravel\Mcp\Server;

/**
 * Ballistic Social MCP Server.
 *
 * This server exposes Ballistic's todo management capabilities to AI agents
 * following the Model Context Protocol (MCP) specification.
 *
 * Features:
 * - Read todos, projects, tags and user profile
 * - Create, update, complete, and delete todos
 * - Assign todos to connected users
 * - Create and manage projects
 * - Search and filter items
 *
 * Security:
 * - All operations scoped to authenticated user
 * - Respects ItemPolicy authorization rules
 * - Validates connection requirements for task assignment
 */
final class BallisticServer extends Server
{
    /**
     * The supported MCP protocol versions.
     */
    public array $supportedProtocolVersion = [
        '2025-06-18',
        '2025-03-26',
        '2024-11-05',
    ];

    /**
     * The server capabilities.
     */
    public array $capabilities = [
        'tools' => [
            'listChanged' => true,
        ],
        'resources' => [
            'listChanged' => true,
            'subscribe' => true,
        ],
        'prompts' => [
            'listChanged' => false,
        ],
    ];

    /**
     * The MCP server name.
     */
    public string $serverName = 'Ballistic Social';

    /**
     * The MCP server version.
     */
    public string $serverVersion = '0.16.1';

    /**
     * Instructions for AI agents interacting with this server.
     */
    public string $instructions = <<<'INSTRUCTIONS'
        This MCP server provides access to Ballistic Social, a task management application.

        Key Concepts:
        - Items: Tasks/todos with title, description, status, due dates, and recurrence rules
        - Projects: Organisational containers for grouping related items
        - Tags: Labels for categorising items (many-to-many relationship)
        - Connections: Mutual consent relationships enabling task delegation

        Item Statuses:
        - todo: Not started (default)
        - doing: In progress
        - done: Completed
        - wontdo: Cancelled/skipped

        Task Assignment:
        - Users can only assign tasks to connected users (mutual consent required)
        - Assignees can update status and assignee_notes only
        - Assignees can reject tasks by setting assignee_id to null

        Best Practices:
        1. Use search_items to find existing items before creating duplicates
        2. Use lookup_users to find valid assignees before assignment
        3. Check project existence before assigning items to projects
        4. Use appropriate scopes (active, planned, all) when searching
        INSTRUCTIONS;

    /**
     * Available MCP tools.
     *
     * @var array<class-string>
     */
    public array $tools = [
        // Item management
        CreateItemTool::class,
        UpdateItemTool::class,
        CompleteItemTool::class,
        DeleteItemTool::class,
        AssignItemTool::class,
        SearchItemsTool::class,

        // Project management
        CreateProjectTool::class,
        UpdateProjectTool::class,

        // Tag management
        CreateTagTool::class,

        // User operations
        LookupUsersTool::class,
    ];

    /**
     * Available MCP resources.
     *
     * @var array<class-string>
     */
    public array $resources = [
        UserProfileResource::class,
        ItemsResource::class,
        ItemResource::class,
        ProjectsResource::class,
        ProjectResource::class,
        TagsResource::class,
        ConnectionsResource::class,
    ];

    /**
     * Available MCP prompts.
     *
     * @var array<class-string>
     */
    public array $prompts = [];

    /**
     * Maximum pagination length.
     */
    public int $maxPaginationLength = 100;

    /**
     * Default pagination length.
     */
    public int $defaultPaginationLength = 25;

    /**
     * Boot the server.
     *
     * Checks that the authenticated user has the AI assistant feature enabled.
     */
    public function boot(): void
    {
        $user = request()->user();

        if (! $user) {
            abort(401);
        }

        $flags = $user->feature_flags ?? [];
        $aiEnabled = $flags['ai_assistant'] ?? false;

        if (! $aiEnabled) {
            abort(404);
        }
    }
}

<?php

declare(strict_types=1);

use App\Http\Middleware\EnsureAiAssistantEnabled;
use App\Mcp\Servers\BallisticServer;
use Laravel\Mcp\Server\Facades\Mcp;

/*
|--------------------------------------------------------------------------
| MCP (Model Context Protocol) Routes
|--------------------------------------------------------------------------
|
| These routes expose the Ballistic MCP server for AI agent integration.
| The server follows the MCP specification for tool and resource discovery.
|
| Web Server (HTTP):
|   POST /mcp - Primary MCP endpoint for AI agents
|   Requires Sanctum authentication via Bearer token and AI feature flag
|
| Local Server (STDIO):
|   Run: php artisan mcp:start ballistic
|   Used for MCP Inspector verification and local testing
|
*/

// Web-based MCP server (HTTP transport)
// Protected by Sanctum authentication, AI feature flag, and rate limiting
// Available at POST /mcp (the McpServiceProvider adds the /mcp prefix)
Mcp::web('', BallisticServer::class)
    ->middleware('auth:sanctum')
    ->middleware(EnsureAiAssistantEnabled::class)
    ->middleware('throttle:mcp');

// Local MCP server (STDIO transport)
// Used for MCP Inspector verification: php artisan mcp:start ballistic
Mcp::local('ballistic', BallisticServer::class);

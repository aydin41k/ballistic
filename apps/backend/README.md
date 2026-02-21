# Ballistic Backend

Ballistic Backend is a Laravel 12 + Inertia (React) application that powers item and project management for the Ballistic product, with a JSON API and web session flows.

## Features
- Authentication with session-based flows and API tokens (Laravel Sanctum)
- User profile settings, appearance preferences, and password management
- Project management with archive/restore support
- Item management with status workflow, ordering, tagging, and scheduling filters
- Recurring item generation for scheduled work
- Tag management with item counts
- Admin endpoints for user management and activity/stats reporting
- **AI Assistant Integration** via Model Context Protocol (MCP)
- OpenAPI spec for the API in `openapi.yaml`

## AI Assistant Integration (MCP)

Ballistic supports the [Model Context Protocol](https://modelcontextprotocol.io/), allowing you to connect AI assistants like Claude to manage your tasks using natural language.

### What Can the AI Do?

Once connected, you can ask your AI assistant to:
- **Create tasks**: "Add a task to review the Q3 report by Friday"
- **Search and filter**: "Show me all overdue tasks" or "What's assigned to me?"
- **Update tasks**: "Mark the budget review as done" or "Move that task to the Marketing project"
- **Manage projects**: "Create a new project called Website Redesign"
- **Organise with tags**: "Tag all my design tasks with 'creative'"
- **Delegate work**: "Assign the client meeting prep to Sarah"

### Getting Started

1. **Enable the AI Assistant feature** in the Ballistic app:
   - Go to Settings → Features → Enable "AI Assistant"

2. **Create an API token** at Settings → AI Assistant:
   - Enter a name (e.g., "Claude Desktop")
   - Click "Create Token" and copy it immediately
   - This creates an MCP-scoped token (`mcp:*`) that only works with `/mcp`

3. **Configure your AI assistant** (e.g., Claude Desktop):
   ```json
   {
     "mcpServers": {
       "ballistic": {
        "url": "https://your-ballistic-instance.com/mcp",
        "headers": {
          "Authorization": "Bearer YOUR_MCP_TOKEN"
        }
      }
    }
  }
   ```

4. **Restart your AI assistant** and start chatting about your tasks!

Note: login/register session tokens are API-scoped (`api:*`) and are not accepted by `/mcp`.

### Example Conversations

**Planning your day:**
> "What tasks do I have due this week? Prioritise them by due date."

**Quick capture:**
> "Add these tasks to my Inbox: buy groceries, call mum, book dentist appointment"

**Project management:**
> "Create a project called 'Q4 Planning' and add tasks for budget review, team sync, and strategy doc"

**Delegation:**
> "Show me my connections, then assign the design review to Alex"

For detailed setup instructions and technical documentation, see [docs/MCP.md](docs/MCP.md).

## Tech stack
- PHP 8.2+, Laravel 12, Sanctum
- Inertia + React, Vite, Tailwind CSS
- SQLite by default (configurable via `.env`)

## Getting started
1. Install backend dependencies: `composer install`
2. Install frontend dependencies: `npm install`
3. Create the environment file: `cp .env.example .env`
4. Generate an app key: `php artisan key:generate`
5. Create the SQLite database file: `touch database/database.sqlite`
6. Run migrations: `php artisan migrate`
7. Start the dev stack: `composer dev`

## API
- Base URL: `http://localhost` by default (see `.env`)
- OpenAPI: `openapi.yaml`
- Auth: `Authorization: Bearer <token>` for API routes; session auth for web routes

## Tests
- Run the test suite: `composer test`

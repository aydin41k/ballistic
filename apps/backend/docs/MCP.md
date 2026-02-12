# Model Context Protocol (MCP) Integration

Ballistic Social provides a full MCP server implementation, enabling AI agents to interact with the task management system programmatically.

## User Guide

### What is MCP?

The Model Context Protocol (MCP) allows AI assistants like Claude to directly interact with Ballistic. Instead of copying and pasting task information, you can simply ask your AI assistant to manage your tasks using natural language.

### What Can the AI Do?

| Action | Example Prompt |
|--------|----------------|
| Create tasks | "Add a task to call the dentist tomorrow" |
| Search tasks | "Show me all tasks due this week" |
| Update tasks | "Mark the budget review as complete" |
| Complete tasks | "I've finished the client proposal" |
| Create projects | "Create a project called Home Renovation" |
| Organise with tags | "Add the 'urgent' tag to my overdue tasks" |
| Delegate tasks | "Assign the meeting prep to Sarah" |
| Check assigned work | "What tasks have been assigned to me?" |

### Getting Started

#### Step 1: Enable AI Assistant Feature

The AI assistant feature must be enabled on your account. You can enable it through the Ballistic mobile/desktop app:

1. Open the Ballistic app
2. Go to **Settings** → **Features**
3. Enable **AI Assistant**

Or via the API:
```bash
curl -X PATCH https://your-ballistic-url.com/api/user \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"feature_flags": {"ai_assistant": true}}'
```

#### Step 2: Create an API Token

Once the AI Assistant feature is enabled:

1. Go to **Settings** → **AI Assistant** (or visit `/settings/api-tokens`)
2. Enter a name for your token (e.g., "Claude Desktop")
3. Click **Create Token**
4. **Copy the token immediately** — you won't be able to see it again

#### Step 3: Configure Your AI Assistant

**Claude Desktop:**

1. Open your Claude Desktop config file:
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`
   - Linux: `~/.config/Claude/claude_desktop_config.json`

2. Add Ballistic as an MCP server:
   ```json
   {
     "mcpServers": {
       "ballistic": {
         "url": "https://your-ballistic-url.com/mcp",
         "headers": {
           "Authorization": "Bearer YOUR_API_TOKEN_HERE"
         }
       }
     }
   }
   ```

3. Replace `YOUR_API_TOKEN_HERE` with the token you created

4. Restart Claude Desktop

**Cursor / VS Code:**

Add to your workspace or user settings:
```json
{
  "mcp.servers": {
    "ballistic": {
      "url": "https://your-ballistic-url.com/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_API_TOKEN"
      }
    }
  }
}
```

**Other MCP-Compatible Tools:**

Any MCP-compatible client can connect using:
- **Endpoint**: `POST /mcp`
- **Authentication**: Bearer token in `Authorization` header
- **Protocol**: JSON-RPC 2.0

### Example Conversations

**Morning planning:**
> You: "What's on my plate today?"
> Claude: *reads your tasks and shows items due today, sorted by priority*

**Quick capture:**
> You: "Add these to my inbox: buy milk, call mum, book flight to Sydney"
> Claude: *creates three tasks in your inbox*

**End of day review:**
> You: "Mark the client meeting and proposal review as done"
> Claude: *completes both tasks*

**Delegation:**
> You: "Assign the website mockups to Alex with a note about the brand guidelines"
> Claude: *assigns the task and adds context for Alex*

### Managing Your Tokens

- View all your tokens at **Settings** → **AI Assistant**
- Each token shows when it was created and last used
- **Revoke a token** by clicking the trash icon — the AI assistant will immediately lose access
- Create separate tokens for different devices or applications

### Privacy & Security

- Your AI assistant can only access **your** tasks and projects
- All actions are logged for audit purposes
- API tokens can be revoked at any time
- The AI cannot access other users' data or perform admin actions
- The feature must be explicitly enabled on your account

---

## Developer Documentation

The following sections provide technical details for developers integrating with or extending the MCP server.

### Overview

The MCP server exposes Ballistic's core functionality through standardised tools and resources, following the [Model Context Protocol specification](https://modelcontextprotocol.io/specification).

### Features

- **Full MCP Compliance**: JSON-RPC 2.0 transport with proper error handling
- **Sanctum Authentication**: Secure token-based access control
- **User Scoping**: All operations automatically scoped to the authenticated user
- **Context-Aware Guards**: Prevents cross-user data access and enforces ItemPolicy rules
- **Audit Logging**: All agent actions logged for security and compliance
- **Dynamic Schema Reflection**: Tool schemas automatically reflect database changes

## Quick Start (Development)

### 1. Generate an API Token

```bash
# Via tinker
sail artisan tinker
>>> $user = User::find('your-user-id');
>>> $token = $user->createToken('mcp-agent')->plainTextToken;
>>> echo $token;
```

### 2. Test the Connection

```bash
curl -X POST http://localhost/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}'
```

### 3. Use MCP Inspector

```bash
# Run the verification script
./mcp-verify.sh install

# Test STDIO transport
APP_SERVICE=model_a ./mcp-verify.sh stdio

# Test HTTP transport
MCP_AUTH_TOKEN='your-token' ./mcp-verify.sh http
```

## Endpoint

```
POST /mcp
Authorization: Bearer <sanctum-token>
Content-Type: application/json
```

## Available Tools

### Item Management

| Tool | Description | Annotations |
|------|-------------|-------------|
| `create_item` | Create a new todo item | Idempotent |
| `update_item` | Update item fields | Idempotent |
| `complete_item` | Mark item as done | Idempotent |
| `delete_item` | Soft-delete an item | Destructive |
| `assign_item` | Assign to connected user | Idempotent |
| `search_items` | Search with filters | Read-only |

### Project Management

| Tool | Description |
|------|-------------|
| `create_project` | Create a new project |
| `update_project` | Update or archive project |

### Tag Management

| Tool | Description |
|------|-------------|
| `create_tag` | Create a categorisation tag |

### User Operations

| Tool | Description |
|------|-------------|
| `lookup_users` | Find connected users for assignment |

## Available Resources

| Resource URI | Description |
|--------------|-------------|
| `ballistic://users/me` | Current user profile with counts |
| `ballistic://items` | List of accessible items |
| `ballistic://items/{id}` | Single item details |
| `ballistic://projects` | User's projects |
| `ballistic://projects/{id}` | Project with item counts |
| `ballistic://tags` | User's tags with usage counts |
| `ballistic://connections` | Connected users |

## Tool Schemas

### create_item

```json
{
  "name": "create_item",
  "inputSchema": {
    "type": "object",
    "properties": {
      "title": {"type": "string", "description": "Item title (required)"},
      "description": {"type": "string"},
      "project_id": {"type": "string", "description": "Project UUID"},
      "status": {"type": "string", "enum": ["todo", "doing", "done", "wontdo"]},
      "scheduled_date": {"type": "string", "description": "ISO 8601 date"},
      "due_date": {"type": "string", "description": "ISO 8601 date"},
      "recurrence_rule": {"type": "string", "description": "RFC 5545 RRULE"},
      "tag_ids": {"type": "array", "items": {"type": "string"}}
    },
    "required": ["title"]
  }
}
```

### search_items

```json
{
  "name": "search_items",
  "inputSchema": {
    "type": "object",
    "properties": {
      "search": {"type": "string", "description": "Text search"},
      "scope": {"type": "string", "enum": ["active", "planned", "all"]},
      "status": {"type": "string", "enum": ["todo", "doing", "done", "wontdo"]},
      "project_id": {"type": "string"},
      "tag_id": {"type": "string"},
      "assigned_to_me": {"type": "boolean"},
      "delegated": {"type": "boolean"},
      "due_from": {"type": "string"},
      "due_to": {"type": "string"},
      "limit": {"type": "integer", "maximum": 100}
    }
  }
}
```

### assign_item

```json
{
  "name": "assign_item",
  "inputSchema": {
    "type": "object",
    "properties": {
      "item_id": {"type": "string", "description": "Item UUID"},
      "assignee_id": {"type": "string", "description": "User UUID or null"},
      "description": {"type": "string", "description": "Context for assignee"}
    },
    "required": ["item_id", "assignee_id"]
  }
}
```

## Security Model

### Authentication

All MCP requests require a valid Sanctum bearer token. Tokens should be created specifically for agent use:

```php
$token = $user->createToken('claude-agent', ['mcp:*'])->plainTextToken;
```

### Authorization Rules

1. **User Scoping**: All queries automatically filter to the authenticated user's data
2. **Owner vs Assignee**:
   - Owners can perform all operations on their items
   - Assignees can only update `status` and `assignee_notes`, or reject by setting `assignee_id` to null
3. **Connection Requirement**: Task assignment requires an accepted mutual connection

### Audit Logging

All MCP operations are logged to the `audit_logs` table:

```json
{
  "action": "mcp.create_item",
  "resource_type": "item",
  "resource_id": "uuid",
  "metadata": {"via": "mcp", "title": "..."}
}
```

## Error Handling

MCP errors follow JSON-RPC 2.0 conventions:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32602,
    "message": "Item not found or access denied: uuid"
  }
}
```

### Error Codes

| Code | Meaning |
|------|---------|
| -32700 | Parse error |
| -32600 | Invalid request |
| -32601 | Method not found |
| -32602 | Invalid params |
| -32603 | Internal error |
| -32000 | Authentication required |

## Integration Examples

### Claude Desktop

Add to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "ballistic": {
      "command": "curl",
      "args": [
        "-X", "POST",
        "-H", "Content-Type: application/json",
        "-H", "Authorization: Bearer YOUR_TOKEN",
        "http://localhost/mcp"
      ]
    }
  }
}
```

### Python Client

```python
import requests

def call_mcp(method, params=None, token=None):
    response = requests.post(
        "http://localhost/mcp",
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}",
        },
        json={
            "jsonrpc": "2.0",
            "id": 1,
            "method": method,
            "params": params or {},
        }
    )
    return response.json()

# Create an item
result = call_mcp("tools/call", {
    "name": "create_item",
    "arguments": {
        "title": "Review PR #123",
        "due_date": "2026-02-15"
    }
}, token="your-token")
```

### JavaScript/Node.js

```javascript
async function callMcp(method, params = {}, token) {
  const response = await fetch('http://localhost/mcp', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method,
      params,
    }),
  });
  return response.json();
}

// Search for overdue items
const result = await callMcp('tools/call', {
  name: 'search_items',
  arguments: {
    due_to: '2026-02-11',
    status: ['todo', 'doing']
  }
}, 'your-token');
```

## Performance

The MCP server is optimised for fast response times:

- **Initialization handshake**: < 100ms (typically ~10ms)
- **Tool listing**: < 50ms
- **Resource reads**: Varies by data volume, typically < 100ms
- **Tool calls**: Varies by operation complexity

Rate limiting is applied at 120 requests/minute per authenticated user.

## Testing

Run the MCP test suite:

```bash
./runtests.sh --filter=McpServerTest
```

Verify with MCP Inspector:

```bash
./mcp-verify.sh all
```

## STDIO Transport (Local)

For local development and CLI integration, use the STDIO transport:

```bash
APP_SERVICE=model_a sail artisan mcp:start ballistic
```

This starts an interactive session reading JSON-RPC from stdin and writing to stdout.

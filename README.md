# Ballistic - Bullet Journal App

A modern bullet journaling application built with Next.js and Tailwind CSS.

## Features

- Task management with status tracking
- Project organization
- Due date management
- Notes and descriptions
- Drag and drop reordering
- Filtering and search
- Responsive design

## Google Apps Script Integration

This app can integrate with Google Apps Script for persistent storage. The integration uses a proxy approach to avoid CORS issues:

### How It Works

1. **Frontend calls local API**: All requests go to `/api/items` endpoints
2. **API proxies to Google Apps Script**: When `NEXT_PUBLIC_GAS_BASE_URL` is configured, the API forwards requests to Google Apps Script
3. **No CORS issues**: Since the frontend only talks to your local API, there are no cross-origin restrictions

### Configuration

Set the environment variable:
```bash
NEXT_PUBLIC_GAS_BASE_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

### API Actions

The following actions are supported:
- `?action=list` - Retrieve all tasks
- `?action=add` - Create a new task
- `?action=update` - Update an existing task
- `?action=move` - Reorder tasks
- `?action=delete` - Delete a task (via update with deleted flag)

### Fallback

When Google Apps Script is not configured or unavailable, the app falls back to local storage for development and testing.

## Development

```bash
npm install
npm run dev
```

## Testing

```bash
./runtests.sh
```

## Building

```bash
npm run build
npm start
```

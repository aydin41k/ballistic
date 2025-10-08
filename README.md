# Ballistic - Bullet Journal App

A modern bullet journaling application built with Next.js and Tailwind CSS.

This initial version uses Google Sheets as the backend, making it incredibly easy and free to deploy. No database setup, no server costs—just a Google Sheet and a simple Apps Script deployment.

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

## Setting Up Google Sheets Backend

To use Google Sheets as your persistent storage backend:

### 1. Create a Google Sheet

1. Go to [Google Sheets](https://sheets.google.com) and create a new spreadsheet
2. Name the sheet (e.g., "Ballistic Tasks")
3. Create a sheet tab called "Main" (or rename the default sheet)
4. Add a header row with the following columns:
   - Column A: `id`
   - Column B: `created_at`
   - Column C: `updated_at`
   - Column D: `task`
   - Column E: `project`
   - Column F: `status`
   - Column G: `notes`

### 2. Add Apps Script

1. In your Google Sheet, click **Extensions** > **Apps Script**
2. Delete any default code in the editor
3. Copy the entire contents of `google-sheet-script.js` from this repository
4. Paste it into the Apps Script editor
5. Click the save icon (💾) and name your project (e.g., "Ballistic API")

### 3. Deploy the Script

1. Click **Deploy** > **New deployment**
2. Click the gear icon (⚙️) next to "Select type" and choose **Web app**
3. Configure the deployment:
   - **Description**: "Ballistic API v1" (or any description)
   - **Execute as**: Me
   - **Who has access**: **Anyone**
4. Click **Deploy**
5. Review and authorise the permissions when prompted
6. Copy the **Web app URL** (it will look like `https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec`)

### 4. Configure the Frontend

Create a `.env` file in the project root and add:

```bash
NEXT_PUBLIC_GAS_BASE_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

Alternatively, add this environment variable to the project as prescribed by the platform that you are deploying to.

Replace `YOUR_SCRIPT_ID` with the actual script ID from your deployment URL.

### 5. Test the Integration

1. Start the development server: `npm run dev`
2. Add a task in the app
3. Check your Google Sheet - the task should appear in the "Main" sheet

### Updating the Script

When you need to update the Apps Script:

1. Make changes in the Apps Script editor
2. Click **Deploy** > **Manage deployments**
3. Click the edit icon (✏️) next to your deployment
4. Under "Version", select **New version**
5. Click **Deploy**

The deployment URL remains the same, so you don't need to update your environment variables.

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

## Contributing

Contributions are welcome! Whether you're fixing bugs, adding features, or improving documentation, your help is appreciated.

### How to Contribute

1. **Check existing issues** or create a new one to discuss your idea
2. **Fork the repository** and create a new branch for your work
3. **Make your changes** and add tests if applicable
4. **Run the tests** with `./runtests.sh` to ensure everything works
5. **Submit a pull request** with a clear description of your changes

For detailed instructions, please see [CONTRIBUTING.md](CONTRIBUTING.md).

### Good First Issues

New to the project? Look for issues labelled "good first issue" to get started.

### Questions or Ideas?

Feel free to open an issue to discuss new features, report bugs, or ask questions. We're here to help!

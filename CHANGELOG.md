## 0.3.3 - 2025-08-28

- **Task Filtering**: Automatically filter out completed and cancelled tasks when fetching the task list
- **Cleaner Task View**: Only active tasks (pending, in_progress) are displayed in the main task list
- **Improved Focus**: Users now see only actionable tasks, reducing visual clutter from completed work
- **API Enhancement**: Modified fetchItems function to exclude "done" and "cancelled" status tasks from list action
- **Maintained Functionality**: All other API operations (add, update, move, delete) continue to work with all task statuses
- **Test Coverage**: Added comprehensive test to verify filtering functionality works correctly

## 0.3.2 - 2025-08-28

- **Optimistic Updates**: Implemented immediate UI updates for all user actions without waiting for API responses
- **Instant Status Changes**: Status circle clicks now update the UI immediately while sending API requests in the background
- **Real-time Reordering**: Move operations (up/down arrows) now update the UI instantly for better user experience
- **Immediate Add/Edit**: New tasks and edits appear in the UI immediately with background API synchronization
- **Background API Calls**: All operations now use "fire and forget" pattern - UI updates instantly, API calls happen asynchronously
- **Fully Optimistic Edits**: Edit forms close immediately upon submission, no waiting for server confirmation
- **Persistent Optimistic State**: User changes remain visible even if API calls fail, maintaining workflow continuity
- **Error Handling**: Failed API calls are logged and can optionally trigger UI rollbacks or user notifications
- **Enhanced UX**: Significantly improved perceived performance and responsiveness across all user interactions
- **Critical Bug Fix**: Fixed "items.map is not a function" runtime error that was crashing the application
- **API Response Validation**: Fixed moveItem function to always return arrays and handle invalid API responses gracefully
- **State Safety**: Added comprehensive array validation to prevent state corruption during optimistic updates
- **Robust Error Handling**: Added comprehensive error handling to prevent UI crashes during optimistic operations

## 0.3.1 - 2025-08-28

- **Fixed CORS Issue**: Resolved CORS error with `?action=update` API calls by adding proper CORS middleware
- **API Middleware**: Added Next.js middleware to handle CORS preflight requests and add CORS headers to all API responses
- **Cross-Origin Support**: Now properly supports cross-origin requests for all API actions (list, add, update, move, delete)
- **Google Apps Script Proxy**: Implemented proxy solution to route all Google Apps Script calls through Next.js API, eliminating CORS issues entirely
- **Seamless Integration**: Frontend now always calls local API endpoints, which proxy to Google Apps Script when configured
- **Fallback Support**: Maintains local store functionality when Google Apps Script is unavailable
- **Production Ready**: Solution works in both development and production environments without CORS configuration

## 0.3.0 - 2025-08-28

- **Major UI Redesign**: Completely redesigned the application to match the exact design specification
- **Enhanced Task Management**: 
  - Added start date and due date fields (replacing single date field)
  - Removed status selection for new tasks (always pending)
  - Added collapsible "More settings" section for project, notes, and dates
  - More settings closed by default for new tasks, open by default for editing
- **Improved User Experience**:
  - Task rows are now clickable to open edit dialog
  - Notes are displayed underneath the category in smaller font
  - **Up/down arrows are now visible on every row** (not hidden in collapsible section)
  - First row shows only down arrow, last row shows only up arrow, middle rows show both
  - Status circles use proper SVG icons instead of emojis
- **UI Polish**:
  - Added footer with "Psycode Pty. Ltd. © 2025"
  - Updated all components to use new data structure
  - Fixed all tests to match new UI implementation
  - Maintained Nunito font family throughout
- **API Improvements**:
  - Fixed column mapping to properly handle GAS data structure (id, task, project, status, notes, created_at, updated_at, due_date)
  - Added fallback to local API when GAS endpoint is not available
  - Ensured proper data display in the UI

## 0.2.4 - 2025-08-28

- Implemented Nunito font family using next/font/google for improved typography
- Added filter and settings icons to header (funnel and gear icons)
- Redesigned quick-add row with blue plus circle and "Add new task..." placeholder
- Enhanced ItemRow styling with strikethrough for completed tasks and blue project names
- Updated tests to use new quick-add button entrypoint
- Fixed Next.js font loader module scope requirement

## 0.2.3 - 2025-08-27

- Fixed React 19 optimistic state update warning in ItemRow component
- Implemented proper React 19 useOptimistic pattern with reducer function
- Wrapped addOptimistic calls with startTransition for proper React 19 compatibility
- Resolved console errors about state updates outside transitions

## 0.2.1 - 2025-08-27

- Fixed all ESLint warnings and code quality issues
- Updated PostCSS and Tailwind config files to follow ESLint best practices
- Removed unused ESLint disable directives
- Fixed unused parameter in API route handlers

## 0.2.0 - 2025-08-27

- Fixed Tailwind CSS compilation issue at build time
- Downgraded from Tailwind CSS v4 to v3 for better Next.js/Turbopack compatibility
- Added proper tailwind.config.ts with content paths configuration
- Resolved CSS utility classes not being included in production builds

## 0.1.2 - 2025-08-27

- Enhanced micro-animations and UX polish
- Added beautiful empty state illustrations with loading, no-items, and no-results states
- Improved StatusCircle with hover effects, scale animations, and status-specific styling
- Enhanced ItemRow with staggered slide-in animations and hover effects
- Added loading states with skeleton UI and spinner animations
- Improved ItemForm with focus states, transitions, and better button interactions
- Added custom CSS keyframes for fade-in, slide-in-up, scale-in, and bounce-in animations
- Enhanced quick-add UX with smooth transitions and better visual feedback

## 0.1.1 - 2025-08-27

- Initial bullet journalling app scaffold (Next.js + Tailwind)
- Mobile-first list UI with status cycle and move controls
- Dummy API endpoints (placeholder for Google Sheets integration)
- Filtering by project/date/status
- Tests: status cycle and row interaction; added ./runtests.sh

## 0.1.0 - 2025-08-27

- Wired client to Google Apps Script backend via env var `NEXT_PUBLIC_GAS_BASE_URL`
- Implemented list/search (`?action=list`), add (`?action=add`), update (`?action=update`), move (`?action=move`)
- Hooked filter UI to remote queries; added add/edit/delete/archiving



# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.9.1] - 2026-01-25

### Added

#### Notification System Improvements
- **NotificationServiceInterface**: Created interface for dependency injection and testability
- **CreateNotificationJob**: Notifications now dispatch jobs instead of creating records directly
  - Jobs have retry configuration (3 attempts, 5 second backoff)
  - Improves performance by offloading notification creation to queue
- **NotificationResource**: New API resource with structured notification response
  - Includes human-readable relative timestamps (`created_at_human`)
  - Formats: "Just now", "2 minutes ago", "1 hour ago", "Yesterday", "3 days ago", "2 weeks ago", "25 Jan", "25 Jan 2025"
  - All timestamps in ISO 8601 format

### Changed
- **NotificationService**: Refactored to implement NotificationServiceInterface
- **NotificationController**: Now uses interface injection and NotificationResource
- **ItemController/ConnectionController**: Updated to use NotificationServiceInterface

### Tests
- Added NotificationServiceTest (10 tests) covering job dispatching for all notification types
- Added CreateNotificationJobTest (7 tests) covering job execution and configuration
- Added NotificationResourceTest (7 tests) covering resource structure and formatting
- Total: 193 tests passing

## [0.9.0] - 2026-01-25

### Fixed

#### Items API Filtering
- **Completed Items Excluded by Default**: All item endpoints now exclude completed (`done`) and cancelled (`wontdo`) items by default
  - Use `?include_completed=true` to include completed/cancelled items
- **Self-Assignment Exclusion**: `assigned_to_me` and `delegated` filters now properly exclude self-assigned items
- **Correct Filter Behaviour**: Fixed potential issues where `assigned_to_me` and `delegated` might return incorrect items

### Added

#### Tags Display (Frontend)
- **Tags in Item Row**: Items now display their tags as coloured badges next to the project name
- **Tag Type Definition**: Added `Tag` interface to frontend types
- **Custom Tag Colours**: Tags with custom colours display with tinted backgrounds

### Changed

#### API Behaviour
- **Server-Side Filtering**: Moved completed/cancelled filtering from client-side to server-side for consistency
- **Frontend API**: Removed client-side filtering of completed items, added `include_completed` parameter

### Tests
- Added 4 new tests for completed items filtering:
  - `test_items_api_excludes_completed_by_default`
  - `test_items_api_includes_completed_when_requested`
  - `test_assigned_to_me_excludes_completed_by_default`
  - `test_delegated_excludes_completed_by_default`
- Updated existing tests to explicitly set item status to avoid false failures
- Total: 169 tests passing

## [0.8.0] - 2026-01-25

### Security

#### API Rate Limiting
- **Route-Level Throttling**: Added comprehensive rate limiting middleware to prevent API abuse
  - `auth` limiter (5 requests/minute per IP) - Applied to `/api/register` and `/api/login`
  - `user-search` limiter (30 requests/minute per user) - Applied to `/api/users/lookup` and `/api/users/discover`
  - `connections` limiter (10 requests/minute per user) - Applied to `POST /api/connections`
  - `api` limiter (60 requests/minute per user) - Applied to all authenticated endpoints as general protection
- **Defence in Depth**: Route-level throttling works alongside existing controller-level rate limiting on login
- **Retry-After Header**: Rate limited responses include standard `Retry-After` header

#### Protected Attack Vectors
- **Brute Force Prevention**: Login and registration endpoints limited to 5 requests/minute per IP
- **Enumeration Attack Prevention**: User discovery and lookup endpoints throttled to prevent harvesting user information
- **Spam Prevention**: Connection request endpoint throttled to prevent spam connection requests
- **General API Abuse**: All authenticated endpoints have baseline rate limiting

### Changed
- **AppServiceProvider**: Now configures all custom rate limiters in `boot()` method
- **routes/api.php**: All routes now have appropriate throttle middleware applied

### Tests
- Added RateLimitingTest with 8 tests covering all throttled endpoints
- Updated AuthenticationTest to accept both route-level (429) and controller-level (422) rate limiting responses
- Total: 165 tests passing

## [0.7.0] - 2026-01-25

### Added

#### Mutual Connections (Security)
- **Connections System**: Users must now connect with each other before task assignment is possible
  - `POST /api/connections` - Send a connection request to another user
  - `GET /api/connections` - List all connections (with optional `?status=` filter)
  - `POST /api/connections/{connection}/accept` - Accept a pending connection request
  - `POST /api/connections/{connection}/decline` - Decline a pending connection request
  - `DELETE /api/connections/{connection}` - Remove an existing connection
- **Connection Model**: New model with requester_id, addressee_id, and status (pending/accepted/declined)
- **User Connection Methods**: Added `connections()`, `isConnectedWith()`, `sentConnectionRequests()`, `receivedConnectionRequests()` methods
- **Auto-Accept**: If User A sends a request to User B who already has a pending request to User A, it auto-accepts

#### User Discovery
- **User Discovery API**: New endpoint `POST /api/users/discover` for finding users to connect with
  - Search by exact email address or phone number (last 9 digits)
  - Returns `{found: true/false}` with minimal user info if found
  - Prevents browsing - requires exact match only
  - Returns masked email for privacy

#### Enhanced Notifications
- **Connection Request Notification**: Users are notified when someone sends them a connection request
- **Connection Accepted Notification**: Users are notified when their connection request is accepted
- **Task Updated Notification**: Assignees are notified when the task owner changes the title or description
- **Task Completed Notification**: Assignees are notified when the task owner marks a task as done or won't do
- **Task Unassigned Notification**: Assignees are notified when they are removed from a task

#### Assignee Notes
- **Assignee Notes Field**: New `assignee_notes` field on items for assignees to add their own notes
  - Assignees can update this field without affecting the task description
  - Owner's description remains protected from assignee modifications

### Changed
- **User Lookup**: Now only returns users who are connected with the current user (for task assignment)
- **Task Assignment Validation**: Assignment now requires the assignee to be connected with the task owner
  - Attempting to assign to an unconnected user returns 403 Forbidden
  - Pending connections do not allow assignment (must be accepted)
- **Assignee Update Restrictions**: Assignees can now only update `status` and `assignee_notes` fields
  - Attempting to update title, description, or other fields returns 403 Forbidden
  - Owners retain full edit access to all fields

### Security
- Fixed privacy issue where users could search for and assign tasks to any user in the system
- Task assignment now requires explicit mutual consent through the connection system
- Connection requests provide notification to the recipient for awareness
- Assignees are restricted from modifying task details (only status and notes)

### Database
- New migration: `create_connections_table` - creates connections table for mutual consent system
  - Unique constraint on requester_id + addressee_id pairs
  - Indexes for efficient status-based lookups
- New migration: `add_assignee_notes_to_items_table` - adds assignee_notes field to items

### Tests
- Added ConnectionTest with 16 tests covering connection CRUD, notifications, and model methods
- Added UserDiscoveryTest with 9 tests for user discovery functionality
- Updated ItemAssignmentTest with 11 new tests for connection validation, field restrictions, and task change notifications
- Updated UserLookupTest with 3 new tests for connection-based filtering
- Updated NotificationTest to create connections before task assignment
- Total: 155 tests passing

## [0.6.0] - 2026-01-25

### Added

#### Task Assignment
- **User Lookup API**: New endpoint `GET /api/users/lookup` for searching users by exact email or phone number suffix (last 9 digits)
- **Task Assignment**: Items can now be assigned to other users via `assignee_id` field
- **Assignee Permissions**: Assignees can view and update status of assigned items, but cannot delete or reassign

#### Notifications (poll-based)
- **Notifications Table**: Simple notifications table for task assignment notifications
- **Notification API**: Poll-based notification endpoints
  - `GET /api/notifications` - Fetch notifications (supports `?unread_only=true`)
  - `POST /api/notifications/{notification}/read` - Mark notification as read
  - `POST /api/notifications/read-all` - Mark all notifications as read
- **NotificationService**: Service for creating and managing notifications
- **Automatic Notifications**: Task assignment automatically creates notification for assignee

#### User Profile
- **Phone Number**: Users can now add an optional phone number to their profile
- **UserLookupResource**: New API resource with masked email for privacy in search results

#### Item Filtering
- **Assigned to Me**: `GET /api/items?assigned_to_me=true` returns items assigned to current user
- **Delegated**: `GET /api/items?delegated=true` returns items owned by current user that are assigned to others
- **Default View**: Default item list now excludes delegated items (shows only unassigned items user owns)

### Changed
- **Item Model**: Added `assignee_id` foreign key, `isAssigned()` and `isDelegated()` helper methods
- **Item Resource**: Now includes `assignee_id`, `assignee`, `owner`, `is_assigned`, `is_delegated` fields
- **Item Policy**: Updated to allow assignees to view and update assigned items
- **User Model**: Added `phone` field, `assignedItems()` and `taskNotifications()` relationships

### Database
- New migration: `add_phone_to_users_table` - adds phone field to users
- New migration: `add_assignee_to_items_table` - adds assignee_id foreign key to items
- New migration: `create_notifications_table` - creates notifications table for poll-based notifications

### Tests
- Added UserLookupTest with 8 tests for user search functionality
- Added ItemAssignmentTest with 11 tests for task assignment and filtering
- Added NotificationTest with 8 tests for notification functionality

## [0.5.3] - 2025-12-10

### Fixed

#### Database
- Fixed `personal_access_tokens` table to support UUID primary keys on User model
- Changed `tokenable_id` column from `bigint` to `uuid` type for PostgreSQL
- Updated migration to use `uuidMorphs()` for SQLite compatibility (testing)
- This resolves the "invalid input syntax for type bigint" error when using API login

### Removed

#### Frontend
- Removed orphaned `register.tsx` page (web registration was disabled in v0.5.2)

## [0.5.2] - 2025-12-10

### Changed

#### Authentication & Authorisation
- Disabled web registration routes - user registration now only available via API (`POST /api/register`)
- Web dashboard and settings are now restricted to admin users only
- Non-admin users attempting to access web dashboard or settings receive 403 Forbidden
- Regular users should use the API and mobile/desktop apps

#### Frontend
- Updated login page to remove "Sign up" link since registration is disabled
- Regenerated wayfinder routes after removing registration routes
- Updated all auth pages (login, forgot-password, reset-password, confirm-password, verify-email) to use new action URL patterns
- Updated settings pages (profile, password) to use new action URL patterns
- Updated delete-user component to use new action URL patterns

### Security
- Added `admin` middleware to web dashboard routes
- Added `admin` middleware to web settings routes (profile, password, appearance)
- Removed web registration routes entirely (GET and POST `/register`)

### Tests
- Updated RegistrationTest to verify web registration is disabled (404) and API registration works
- Updated DashboardTest to verify admin-only access
- Updated ProfileUpdateTest to verify admin-only access to settings
- Updated PasswordUpdateTest to verify admin-only access to password page
- Total: 89 tests passing (285 assertions)

## [0.5.1] - 2025-12-10

### Changed

#### Branding
- Rebranded application UI to "Ballistic" with custom logo and colour theme
- Created new app-logo-icon component featuring paper plane trajectory with waypoint dots and sparkles
- Updated app-logo component with Ballistic name and gradient icon background
- Applied blue gradient colour theme (sky to indigo) throughout the application
- Updated CSS variables with Ballistic brand colours in both light and dark modes
- Changed default application name from 'Laravel' to 'Ballistic' in config/app.php
- Created new favicon.svg with Ballistic branding (gradient background, trajectory, paper plane)
- Updated public/logo.svg with Ballistic wordmark and icon
- Redesigned auth layouts (simple, card, split) with branded gradient backgrounds and decorative elements
- Updated HTML background colours in Blade template to match brand theme
- Redesigned welcome page as promotional landing page with hero section, features grid, and CTAs

## [0.5.0] - 2025-12-10

### Added

#### Phase 1: Code Quality Improvements
- Made User, Project, and Item models `final` with `declare(strict_types=1)` for better type safety
- Added `projects()` and `tags()` relationships to User model
- Created ProjectPolicy for project authorisation with proper UUID comparison
- Created Form Request classes for validation: StoreItemRequest, UpdateItemRequest, StoreProjectRequest, UpdateProjectRequest
- Created API Resource classes for consistent JSON responses: ItemResource, ProjectResource, UserResource, TagResource

#### Phase 2: Expanded API Coverage
- Added `/api/user` endpoint for authenticated user profile (GET and PATCH)
- Added full Projects API: `apiResource('projects')` with archive/restore endpoints
- Added item reordering endpoint: `POST /api/items/reorder`
- Created Api/UserController for user profile management

#### Phase 3: Bullet Journal Features
- **Tags System**: Full CRUD API for tags with many-to-many relationship to items
  - Tag model with user_id, name, and colour fields
  - Tags unique per user, can be assigned to multiple items
  - TagController, TagPolicy, StoreTagRequest, UpdateTagRequest
  - Filter items by tag_id
- **Scheduling**: Added date fields to items
  - `scheduled_date` - when the item is scheduled for
  - `due_date` - deadline for the item
  - `completed_at` - automatically set when status changes to 'done'
  - Date filtering: scheduled_date, scheduled_from, scheduled_to, due_from, due_to, overdue
- **Recurring Items**: RRULE-based recurrence support
  - `recurrence_rule` field for RRULE patterns (e.g., FREQ=DAILY, FREQ=WEEKLY;BYDAY=MO,WE,FR)
  - `recurrence_parent_id` to link generated instances to templates
  - RecurrenceService for parsing rules and generating instances
  - `POST /api/items/{item}/generate-recurrences` endpoint

#### Phase 4: Admin Dashboard
- Added `is_admin` boolean field to users table
- Created EnsureUserIsAdmin middleware with 'admin' alias
- Admin API routes under `/api/admin/*`:
  - `GET /api/admin/stats` - dashboard statistics (users, items, projects, tags, activity)
  - `GET /api/admin/stats/user-activity` - top users by item count
  - Full CRUD for users: `apiResource('admin/users')`
- Admin cannot delete their own account

### Changed
- Refactored ProjectController to API-only (removed view methods)
- ProjectController now uses authenticated user instead of accepting user_id from request
- ProjectController properly authorises all actions via ProjectPolicy
- ItemController now loads tags relationship and supports tag filtering
- Item status 'done' automatically sets/clears completed_at timestamp
- All controllers now use Form Requests for validation
- All controllers now return API Resources for consistent response format
- Updated factories (User, Project, Item, Tag) with new fields and state methods

### Security
- Fixed ProjectController security issue where user_id was accepted from request
- All project operations now properly authorised via policy
- Tags are user-scoped - users can only see and manage their own tags

### Tests
- Added TagTest with 10 tests covering CRUD, authorisation, and item tag assignment
- Added AdminTest with 9 tests covering admin routes, stats, and user management
- Total: 85 tests passing (278 assertions)

### Database
- New tables: `tags`, `item_tag` (pivot)
- Modified `users`: added `is_admin` boolean
- Modified `items`: added `scheduled_date`, `due_date`, `completed_at`, `recurrence_rule`, `recurrence_parent_id`

## [0.4.0] - 2025-10-08

### Added
- Laravel Sanctum package for token-based API authentication
- API register endpoint (POST /api/register) that returns an API token
- API login endpoint (POST /api/login) that returns an API token
- API logout endpoint (POST /api/logout) that revokes the current token
- Bearer token authentication support for all API endpoints
- Rate limiting on API login attempts (5 attempts per email/IP combination)
- Automatic token revocation on login to maintain single active session
- HasApiTokens trait added to User model for token management
- Sanctum guard configuration in auth.php
- Comprehensive test suite for API authentication (18 tests covering registration, login, logout, validation, rate limiting, and token management)
- OpenAPI documentation updated with API authentication endpoints and Bearer token security scheme
- Support for both session-based and token-based authentication

### Changed
- API routes now use Sanctum authentication middleware (auth:sanctum) instead of session-based auth
- All API Item endpoints now support both Bearer token and session authentication
- OpenAPI documentation updated to reflect dual authentication support

## [0.3.1] - 2025-10-08

### Added
- OpenAPI 3.0 compliant documentation file (openapi.yaml)
- Comprehensive API documentation for all available endpoints
- Authentication endpoint documentation (register, login, logout, password reset)
- Item management API endpoint documentation (CRUD operations)
- Profile and settings endpoint documentation
- Email verification endpoint documentation
- Detailed request/response schemas and examples
- Error response documentation for common HTTP status codes

## [0.3.0] - 2025-09-04

### Added
- Full UUID implementation across all models (User, Project, Item, Jobs)
- Complete Laravel 12 test suite compatibility with CSRF middleware handling
- Comprehensive authentication system testing
- Email verification and password reset functionality testing
- User settings and profile management testing
- All 48 tests now passing with 0 failures

### Changed
- Migrated all primary keys from auto-incrementing integers to UUIDs
- Updated User model to use UUID primary key with custom generation
- Modified all foreign key references to use UUIDs
- Enhanced ItemPolicy with proper UUID string comparison for authorization
- Improved test configuration for Laravel 12 middleware compatibility

### Fixed
- CSRF token validation in test environment for Laravel 12
- Authentication session persistence in tests
- User authorization policies with UUID comparison
- Database migration consistency for UUID foreign keys
- Test suite middleware configuration for proper functionality

## [0.2.0] - 2025-09-04

### Added
- Item model with UUID primary key and soft deletes
- Item migration with user_id, project_id (nullable), title, description, status enum, and position fields
- ItemController with full CRUD operations and proper authorization
- ItemFactory with state methods for different statuses and inbox items
- ItemPolicy for user-based authorization
- Comprehensive test suite for Item model functionality
- API routes for Item resource endpoints
- User and Project relationships with Items

## [0.1.0] - 2025-09-04

### Added
- Project model with UUID primary key
- Project migration with user_id foreign key, name, color, and archived_at fields
- ProjectController with full CRUD operations and archive/restore functionality
- ProjectFactory for testing and seeding
- Comprehensive test suite for Project model functionality
- User relationship on Project model
- Soft deletes support for archiving projects

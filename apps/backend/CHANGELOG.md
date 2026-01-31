# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.8.0] - 2026-01-31

### Added

#### Activity Stats
- **DailyStat model**: Tracks per-user, per-day created and completed item counts in a `daily_stats` table with a unique constraint on `(user_id, date)`
- **ItemObserver**: Automatically maintains daily stats on item lifecycle events — increments `created_count` on creation, adjusts `completed_count` on status transitions into/out of `done`
- **DailyStatService**: Service layer for incrementing/decrementing stat counters with tag-based cache invalidation
- **Backfill migration**: Idempotent two-pass migration populates `daily_stats` from existing items (created_count from `created_at`, completed_count from `completed_at`)
- **`GET /api/stats`**: Returns `heatmap` (daily completion counts) and `category_distribution` (completed items grouped by project with colour) for the authenticated user, with optional `from`/`to` date range filtering (defaults to the last 365 days). Responses are cached for 60 seconds with tag-based invalidation

### Tests
- Added 8 feature tests covering observer increments/decrements, endpoint responses, authentication, date-range filtering, and category distribution
- Backend: 123 tests (399 assertions); Frontend: 40 tests

## [0.7.1] - 2026-01-26

### Fixed

#### Optimistic UI Error Recovery
- **Create item**: On backend failure, the phantom optimistic item is removed from the list and the user is notified via an error toast
- **Update item**: On backend failure, the item reverts to its pre-edit state and the user is notified
- **Delete item**: On backend failure, the deleted item is restored to its original position and the user is notified
- **Reorder (move buttons + drag-and-drop)**: On backend failure, the list reverts to its pre-reorder order and the user is notified
- **Status toggle**: On backend failure, the item reverts to its original status and the user is notified
- Added auto-dismissing error toast banner (4 seconds) with manual dismiss

#### Multi-Device Login
- Login no longer revokes all existing user tokens — each device gets its own session
- Logging in from a new device no longer signs out existing sessions
- Logout still correctly revokes only the current device's token

### Tests
- Updated `test_login_preserves_existing_tokens` to verify old tokens remain valid after a new login
- Updated frontend Jest tests for new `recurrence_*` fields in form submissions and API calls
- Added `onError` prop to ItemRow test renders
- Fixed drag-reorder test to use `reorderItems` instead of removed `saveItemOrder`
- Backend: 115 tests (368 assertions); Frontend: 40 tests

## [0.7.0] - 2026-01-26

### Added

#### Recurring Items — Frontend & Expiry Strategy
- **Recurrence UI**: ItemForm now includes a "Repeat" dropdown (None, Daily, Weekdays, Weekly, Monthly) and an "If missed" dropdown (Carries over until done / Expires if missed), shown inside the collapsible "More settings" section
- **Recurrence Indicator**: ItemRow displays a small repeat/loop icon next to the title for recurring templates and instances
- **Recurrence Strategy Column**: New nullable `recurrence_strategy` column on items table (`'expires'` or `'carry_over'`)
- **Auto-Expiry**: `GET /api/items` now automatically marks past recurring instances with `expires` strategy as `wontdo` (items scheduled for today are not affected; templates are never expired)
- **Strategy Inheritance**: Recurring instances generated via `RecurrenceService::generateInstances()` inherit `recurrence_strategy` from their template

### Fixed

#### WEEKLY BYDAY Recurrence Bug
- **Multi-Day Weekly Recurrences**: `FREQ=WEEKLY;BYDAY=MO,WE,FR` now correctly generates occurrences for all specified weekdays instead of only one per week
- `advanceDate()` steps day-by-day when `FREQ=WEEKLY` with `BYDAY` is present, and honours `INTERVAL` at week boundaries

### Changed
- Frontend `Item` interface now includes `recurrence_strategy` field
- Frontend `createItem()` and `updateItem()` API calls now include `recurrence_rule` and `recurrence_strategy`
- Frontend `page.tsx` create and edit handlers wire recurrence fields through to optimistic updates and API calls
- Backend `StoreItemRequest` and `UpdateItemRequest` validate `recurrence_strategy` (nullable, must be `expires` or `carry_over`)
- Backend `ItemResource` now includes `recurrence_strategy` in the JSON response
- Backend `Item` model `$fillable` includes `recurrence_strategy`

### Documentation
- Updated OpenAPI spec to v0.7.0 with `recurrence_strategy` on Item schema and all create/update request bodies

### Tests
- Added 9 new backend tests:
  - 3 BYDAY recurrence tests (single week, multi-week, without BYDAY regression)
  - 3 strategy validation tests (valid create, invalid create, update)
  - 3 auto-expiry tests (expires past instances, does not expire today, does not expire templates)
- Total: 115 tests passing (367 assertions)

## [0.6.2] - 2026-01-26

### Changed

#### Data Integrity
- **DB Transactions**: All multi-write operations are now wrapped in `DB::transaction()` to guarantee atomicity:
  - `ItemController::store()` — item creation + tag sync
  - `ItemController::update()` — item update + tag sync
  - `ItemController::reorder()` — all position updates across submitted and non-submitted items
  - `RecurrenceService::generateInstances()` — recurring item creation + tag sync in loop
  - `AuthController::login()` — token revocation + token creation
  - `UserController::update()` — profile update + email verification reset

### Documentation

#### OpenAPI Specification
- **`POST /api/items/reorder`**: Documented bulk reorder endpoint with request schema (max 100 items, positions 0–9999), response, and error codes (401, 422, 429)
- **`POST /api/items/{id}/generate-recurrences`**: Documented recurrence generation endpoint with date range request body, Item array response, and error codes (400, 401, 403, 404, 422, 429)
- Updated OpenAPI spec version to 0.6.2

## [0.6.1] - 2026-01-26

### Changed

#### API Efficiency
- **Bulk Reorder**: Frontend now uses `POST /api/items/reorder` for all reorder operations (move-to-top, drag-and-drop) instead of firing N individual PATCH requests per item
- **Removed Redundant Fetch**: Move operations no longer re-fetch the full item list from the server before reordering — positions are computed from client state
- **Simplified ItemRow**: Reorder logic delegated entirely to the parent component; ItemRow only triggers the optimistic update

### Security

#### API Rate Limiting
- **Global API Throttle**: All API routes now enforce 60 requests per minute per authenticated user (falls back to IP for unauthenticated requests) via `throttle:api` middleware
- Added `RateLimiter::for('api')` definition in `AppServiceProvider`
- Added `$middleware->throttleApi()` in `bootstrap/app.php`

#### Input Hardening
- **Reorder Payload Limits**: `POST /api/items/reorder` now rejects arrays exceeding 100 items and positions exceeding 9999
- **Removed `exists` Validation on Reorder IDs**: Replaced N per-ID `exists:items,id` database queries with a single ownership-check query using `whereIn`, preventing enumeration of item IDs across users
- **Scope Parameter Validation**: `?scope=` query parameter on `GET /api/items` now rejects invalid values (only accepts `active`, `planned`, `all`)
- **CSS Selector Sanitisation**: `scrollToItemId` value is now escaped via `CSS.escape()` before use in `querySelector`

### Fixed

#### Reorder Position Conflicts
- **Position Double-ups**: Reordering active items no longer leaves completed/cancelled items with conflicting positions
- The `POST /api/items/reorder` endpoint now renumbers all non-submitted items to positions after the submitted range, preserving their relative order
- Every item owned by a user is guaranteed a unique position after any reorder operation

#### Frontend completed_at Mismatch
- **Optimistic completed_at**: Status toggle now correctly computes `completed_at` in the optimistic update (set on `done`, cleared when leaving `done`)
- **Server Reconciliation**: After `updateStatus()` resolves, server-authoritative `completed_at` and `updated_at` are merged into client state
- **Race Condition Guard**: If the user toggles status again before the server responds, the stale response is skipped (prevents UI flicker)
- `onRowChange` now accepts a functional updater `(current: Item) => Item` for safe concurrent reconciliation

### Tests
- Added 6 new tests for the reorder endpoint:
  - Bulk reorder updates positions correctly
  - Reorder silently skips items not owned by the requesting user
  - Oversized payload (>100 items) is rejected with 422
  - Excessive position value (>9999) is rejected with 422
  - Unauthenticated requests receive 401
  - Reorder renumbers non-submitted items to avoid position conflicts
- Total: 106 tests passing (344 assertions)

## [0.6.0] - 2026-01-26

### Added

#### Time Intelligence
- **Query Scopes**: Added `active`, `planned`, and `overdue` Eloquent query scopes to Item model
  - `active`: Returns items with no scheduled date or scheduled date <= today
  - `planned`: Returns items with scheduled date > today (future-only)
  - `overdue`: Returns items past their due date that are not done/wontdo
- **Default Scope Filtering**: `GET /api/items` now hides future-scheduled items by default
  - `?scope=planned` returns only future-scheduled items
  - `?scope=all` returns all items regardless of scheduling
- **Date Validation**: `due_date` must not be before `scheduled_date` (enforced in both StoreItemRequest and UpdateItemRequest)
- **Factory States**: Added `overdue()` and `futureScheduled()` factory states for test convenience
- **Frontend Date Pickers**: ItemForm now includes date inputs for scheduled date and due date
- **Frontend Urgency Sorting**: Items are sorted by urgency (overdue first, due within 72 hours second, nearest deadline third, then by position)
- **Frontend Urgency Indicators**: Visual cues on items — red left border + "Overdue" label for past-due items, amber border for items due within 72 hours
- **Frontend Planned View**: Filter button toggles between active and planned views, fetching future-scheduled items via `?scope=planned`

### Changed
- Updated OpenAPI specification with `scheduled_date`, `due_date`, `completed_at`, recurrence fields, and new query parameters
- Updated frontend TypeScript `Item` interface with all scheduling and recurrence fields
- Updated frontend API client (`createItem`, `updateItem`, `fetchItems`) to support date fields and scope parameter

### Tests
- Added 11 new feature tests covering:
  - Creating items with scheduled/due dates
  - Validation: due_date cannot precede scheduled_date
  - Validation: due_date can equal scheduled_date
  - Update validation for date ordering
  - Default index excludes future-scheduled items
  - `?scope=planned` returns only future items
  - `?scope=all` returns everything
  - Overdue filter functionality
  - Today-scheduled items are visible by default

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

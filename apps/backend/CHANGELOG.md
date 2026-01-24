# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

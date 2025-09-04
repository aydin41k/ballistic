# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

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
- OpenAPI spec for the API in `openapi.yaml`

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

<?php

declare(strict_types=1);

use App\Http\Controllers\Admin\StatsController as AdminStatsController;
use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\StatsController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\ItemController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\TagController;
use Illuminate\Support\Facades\Route;

// Public API routes (no authentication required)
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Protected API routes (authentication required)
Route::middleware(['auth:sanctum'])->group(function () {
    // Authentication
    Route::post('/logout', [AuthController::class, 'logout']);

    // User profile
    Route::get('/user', [UserController::class, 'show']);
    Route::patch('/user', [UserController::class, 'update']);

    // Projects
    Route::apiResource('projects', ProjectController::class);
    Route::post('projects/{project}/archive', [ProjectController::class, 'archive']);
    Route::post('projects/{project}/restore', [ProjectController::class, 'restore']);

    // Items (specific routes before resource to ensure proper matching)
    Route::post('items/reorder', [ItemController::class, 'reorder']);
    Route::post('items/{item}/generate-recurrences', [ItemController::class, 'generateRecurrences']);
    Route::apiResource('items', ItemController::class);

    // Tags
    Route::apiResource('tags', TagController::class);

    // Activity Statistics
    Route::get('stats', [StatsController::class, 'index']);

    // Admin routes
    Route::prefix('admin')->middleware(['admin'])->group(function () {
        Route::apiResource('users', AdminUserController::class);
        Route::get('stats', [AdminStatsController::class, 'index']);
        Route::get('stats/user-activity', [AdminStatsController::class, 'userActivity']);
    });
});

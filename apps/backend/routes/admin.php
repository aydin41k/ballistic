<?php

declare(strict_types=1);

use App\Http\Controllers\Admin\Web\DashboardController;
use App\Http\Controllers\Admin\Web\UsersController;
use Illuminate\Support\Facades\Route;

Route::prefix('admin')
    ->name('admin.')
    ->middleware(['auth', 'verified', 'admin'])
    ->group(function (): void {
        // Health Pulse dashboard
        Route::get('/', DashboardController::class)->name('dashboard');

        // User management
        Route::get('/users', [UsersController::class, 'index'])->name('users.index');
        Route::get('/users/{user}', [UsersController::class, 'show'])->name('users.show');
        Route::patch('/users/{user}', [UsersController::class, 'update'])->name('users.update');
        Route::post('/users/{user}/hard-reset', [UsersController::class, 'hardReset'])->name('users.hard-reset');
    });

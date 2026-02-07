<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

// Smart dashboard redirect: admins go to admin panel, others go to profile settings
Route::get('dashboard', function () {
    if (auth()->user()?->is_admin) {
        return redirect()->route('admin.dashboard');
    }

    return redirect()->route('profile.edit');
})->name('dashboard')->middleware(['auth', 'verified']);

require __DIR__.'/admin.php';
require __DIR__.'/settings.php';
require __DIR__.'/auth.php';

<?php

declare(strict_types=1);

use App\Http\Controllers\ItemController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth'])->group(function () {
    Route::apiResource('items', ItemController::class);
});

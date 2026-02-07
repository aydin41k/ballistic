<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin\Web;

use App\Http\Controllers\Controller;
use App\Services\AdminStatsService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class DashboardController extends Controller
{
    public function __construct(
        private readonly AdminStatsService $statsService,
    ) {}

    public function __invoke(Request $request): Response
    {
        return Inertia::render('admin/dashboard', [
            'stats' => $this->statsService->getHealthPulse(),
        ]);
    }
}

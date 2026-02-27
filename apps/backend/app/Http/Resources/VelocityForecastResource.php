<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class VelocityForecastResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    #[\Override]
    public function toArray(Request $request): array
    {
        /** @var array<string, mixed> $data */
        $data = $this->resource;

        return [
            'velocity' => round((float) $data['velocity'], 2),
            'std_dev' => round((float) $data['std_dev'], 2),
            'capacity' => round((float) $data['capacity'], 2),
            'demand' => (int) $data['demand'],
            'demand_task_count' => (int) $data['demand_task_count'],
            'burnout_risk' => (bool) $data['burnout_risk'],
            'probability_of_success' => $data['probability_of_success'] !== null
                ? round((float) $data['probability_of_success'], 4)
                : null,
            'data_points' => (int) $data['data_points'],
            'weekly_totals' => $data['weekly_totals'],
        ];
    }
}

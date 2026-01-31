<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

final class DailyStat extends Model
{
    /** @use HasFactory<\Database\Factories\DailyStatFactory> */
    use HasFactory;

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'user_id',
        'date',
        'completed_count',
        'created_count',
    ];

    protected $casts = [
        'date' => 'date',
        'completed_count' => 'integer',
        'created_count' => 'integer',
    ];

    protected static function boot(): void
    {
        parent::boot();

        self::creating(function ($model): void {
            if (empty($model->id)) {
                $model->id = Str::uuid();
            }
        });
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}

<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class DailyStat extends \Illuminate\Database\Eloquent\Model
{
    protected $fillable = [
        'user_id',
        'date',
        'completed_count',
        'created_count',
    ];

    protected $casts = [
        'completed_count' => 'integer',
        'created_count' => 'integer',
    ];

    /** @var bool No created_at / updated_at columns on this table. */
    public $timestamps = false;

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}

<?php

declare(strict_types=1);

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Native mobile push subscription registered through the Expo push service.
 *
 * @property string $id
 * @property string $user_id
 * @property string $expo_push_token
 * @property string $platform
 * @property string|null $device_name
 * @property Carbon|null $last_used_at
 * @property Carbon $created_at
 * @property Carbon $updated_at
 * @property-read User $user
 */
final class MobilePushSubscription extends Model
{
    use HasUuids;

    /**
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'expo_push_token',
        'platform',
        'device_name',
        'last_used_at',
    ];

    /**
     * @return array<string, string>
     */
    #[\Override]
    protected function casts(): array
    {
        return [
            'last_used_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<User, MobilePushSubscription>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}

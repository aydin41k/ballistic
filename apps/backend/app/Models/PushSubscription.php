<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Push subscription for Web Push notifications.
 *
 * @property string $id
 * @property string $user_id
 * @property string $endpoint
 * @property string $p256dh_key
 * @property string $auth_key
 * @property string|null $user_agent
 * @property \Carbon\Carbon|null $last_used_at
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 * @property-read User $user
 */
final class PushSubscription extends Model
{
    use HasUuids;

    /**
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'endpoint',
        'p256dh_key',
        'auth_key',
        'user_agent',
        'last_used_at',
    ];

    /**
     * @var array<string, string>
     */
    protected $casts = [
        'last_used_at' => 'datetime',
    ];

    /**
     * @return BelongsTo<User, PushSubscription>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the subscription data in the format expected by web-push libraries.
     *
     * @return array{endpoint: string, keys: array{p256dh: string, auth: string}}
     */
    public function toWebPushFormat(): array
    {
        return [
            'endpoint' => $this->endpoint,
            'keys' => [
                'p256dh' => $this->p256dh_key,
                'auth' => $this->auth_key,
            ],
        ];
    }

    /**
     * Update the last_used_at timestamp.
     */
    public function markAsUsed(): void
    {
        $this->update(['last_used_at' => now()]);
    }
}

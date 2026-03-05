<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Global, admin-toggled feature flag.
 *
 * Reads should always go through {@see \App\Services\FeatureFlagService} so
 * the cached key-value map is used instead of hitting the database on every
 * request. The service forgets its cache key on every write.
 *
 * Do not confuse this with {@see User::$feature_flags} — that JSON column
 * stores per-user preferences; this model stores site-wide switches.
 *
 * @property string $key
 * @property bool $enabled
 * @property string $label
 * @property string|null $description
 */
final class FeatureFlag extends Model
{
    /** @use HasFactory<\Database\Factories\FeatureFlagFactory> */
    use HasFactory;

    /**
     * The flag key doubles as the primary key so lookups are O(1) and
     * the cached map is a simple key => bool dictionary.
     */
    protected $primaryKey = 'key';

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'key',
        'enabled',
        'label',
        'description',
    ];

    protected function casts(): array
    {
        return [
            'enabled' => 'boolean',
        ];
    }
}

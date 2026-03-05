<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\FeatureFlag;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;

/**
 * Cached accessor and mutator for global, admin-toggled feature flags.
 *
 * All reads go through the cache (Redis/Memcached/etc. — whatever is
 * configured) so the DB is never hit on the hot path. Writes invalidate the
 * cache key so the next read re-hydrates from the database.
 */
final readonly class FeatureFlagService
{
    private const CACHE_KEY = 'feature_flags:all';

    /**
     * TTL guards against a stale cache if the invalidation somehow fails
     * (e.g. a deploy that writes to the DB without going through this service).
     * Short enough to self-heal, long enough that normal traffic never touches
     * the DB.
     */
    private const CACHE_TTL_SECONDS = 300;

    /**
     * Cached map of all flag keys to their enabled state.
     *
     * @return array<string, bool>
     */
    public function all(): array
    {
        return Cache::remember(
            self::CACHE_KEY,
            self::CACHE_TTL_SECONDS,
            static fn (): array => FeatureFlag::query()
                ->pluck('enabled', 'key')
                ->map(static fn ($v): bool => (bool) $v)
                ->all()
        );
    }

    /**
     * Whether a given flag is enabled. Unknown keys resolve to the supplied
     * default so callers don't need existence checks.
     */
    public function enabled(string $key, bool $default = false): bool
    {
        return $this->all()[$key] ?? $default;
    }

    /**
     * Full flag rows for the admin UI (label, description, timestamps).
     * This reads from the DB directly — it is admin-only and rarely called,
     * so caching it separately is unnecessary complexity.
     *
     * @return Collection<int, FeatureFlag>
     */
    public function adminList(): Collection
    {
        return FeatureFlag::query()->orderBy('key')->get();
    }

    /**
     * Set a flag's enabled state and bust the cache. Creates the row if it
     * doesn't exist so admins can register new flags on the fly.
     */
    public function set(string $key, bool $enabled, ?string $label = null, ?string $description = null): FeatureFlag
    {
        $flag = FeatureFlag::query()->updateOrCreate(
            ['key' => $key],
            array_filter(
                [
                    'enabled' => $enabled,
                    'label' => $label,
                    'description' => $description,
                ],
                // Keep explicit false for 'enabled', drop nulls for label/description
                // so partial updates don't wipe existing metadata.
                static fn ($v, $k): bool => $k === 'enabled' || $v !== null,
                ARRAY_FILTER_USE_BOTH
            )
        );

        $this->flush();

        return $flag;
    }

    /**
     * Invalidate the cached flag map. Called after every write; exposed
     * publicly so seeders / tests can force a re-hydration.
     */
    public function flush(): void
    {
        Cache::forget(self::CACHE_KEY);
    }
}

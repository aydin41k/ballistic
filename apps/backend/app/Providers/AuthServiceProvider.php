<?php

declare(strict_types=1);

namespace App\Providers;

use App\Models\Item;
use App\Models\Project;
use App\Models\Tag;
use App\Models\User;
use App\Policies\ItemPolicy;
use App\Policies\ProjectPolicy;
use App\Policies\TagPolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;

final class AuthServiceProvider extends ServiceProvider
{
    /**
     * The model to policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        Item::class => ItemPolicy::class,
        Project::class => ProjectPolicy::class,
        Tag::class => TagPolicy::class,
    ];

    /**
     * Register any authentication / authorization services.
     */
    public function boot(): void
    {
        $this->registerPolicies();

        Gate::define('admin', fn (User $user): bool => $user->is_admin);
    }
}

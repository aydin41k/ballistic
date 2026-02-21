<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Auth\TokenAbility;
use Illuminate\Console\Command;
use Laravel\Sanctum\PersonalAccessToken;

/**
 * One-time migration command that assigns explicit scopes to legacy wildcard tokens.
 *
 * Wildcard tokens (`["*"]`) predate the MCP/API token separation. This command
 * allows operators to reassign them to either `api:*` or `mcp:*` before the
 * MCP_LEGACY_WILDCARD_CUTOFF_AT grace period expires.
 *
 * Usage:
 *   php artisan tokens:migrate-scopes            (dry-run by default)
 *   php artisan tokens:migrate-scopes --execute  (apply changes)
 *   php artisan tokens:migrate-scopes --scope=api:* --execute
 */
final class MigrateTokenScopesCommand extends Command
{
    protected $signature = 'tokens:migrate-scopes
                            {--scope=api:* : Target scope to assign (api:* or mcp:*)}
                            {--execute : Apply changes — omit to run as a dry-run}';

    protected $description = 'Migrate legacy wildcard tokens to explicit api:* or mcp:* scopes';

    public function handle(): int
    {
        $scope = $this->option('scope');
        $execute = (bool) $this->option('execute');

        if (! in_array($scope, [TokenAbility::Api->value, TokenAbility::Mcp->value], true)) {
            $this->error("Invalid scope \"{$scope}\". Must be \"api:*\" or \"mcp:*\".");

            return self::FAILURE;
        }

        $tokens = PersonalAccessToken::query()
            ->whereJsonContains('abilities', TokenAbility::Wildcard->value)
            ->get();

        if ($tokens->isEmpty()) {
            $this->info('No legacy wildcard tokens found.');

            return self::SUCCESS;
        }

        $this->table(
            ['ID', 'Name', 'Tokenable', 'Created At'],
            $tokens->map(fn (PersonalAccessToken $t) => [
                $t->id,
                $t->name,
                "{$t->tokenable_type}:{$t->tokenable_id}",
                $t->created_at?->toDateTimeString(),
            ]),
        );

        $count = $tokens->count();

        if (! $execute) {
            $this->comment("Dry-run: {$count} token(s) would be migrated to \"{$scope}\". Pass --execute to apply.");

            return self::SUCCESS;
        }

        if (! $this->confirm("Migrate {$count} wildcard token(s) to \"{$scope}\"?")) {
            $this->info('Aborted.');

            return self::SUCCESS;
        }

        foreach ($tokens as $token) {
            $token->forceFill(['abilities' => [$scope]])->save();
        }

        $this->info("Migrated {$count} token(s) to \"{$scope}\".");

        return self::SUCCESS;
    }
}

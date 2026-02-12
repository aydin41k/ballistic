<?php

declare(strict_types=1);

namespace App\Mcp\Services;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Laravel\Mcp\Server\Tools\ToolInputSchema;

/**
 * Dynamically generates JSON Schema from Eloquent models and database tables.
 *
 * This service introspects the database schema to automatically generate
 * MCP tool input schemas. When fields are added to tables, the schema
 * automatically reflects those changes without manual intervention.
 */
final class SchemaReflector
{
    /**
     * Cache duration in seconds (5 minutes).
     */
    private const CACHE_TTL = 300;

    /**
     * Map of database column types to JSON Schema types.
     */
    private const TYPE_MAP = [
        'bigint' => 'integer',
        'int' => 'integer',
        'integer' => 'integer',
        'smallint' => 'integer',
        'tinyint' => 'integer',
        'decimal' => 'number',
        'double' => 'number',
        'float' => 'number',
        'real' => 'number',
        'numeric' => 'number',
        'bool' => 'boolean',
        'boolean' => 'boolean',
        'date' => 'string',
        'datetime' => 'string',
        'timestamp' => 'string',
        'time' => 'string',
        'year' => 'integer',
        'char' => 'string',
        'varchar' => 'string',
        'text' => 'string',
        'mediumtext' => 'string',
        'longtext' => 'string',
        'json' => 'object',
        'jsonb' => 'object',
        'uuid' => 'string',
        'enum' => 'string',
    ];

    /**
     * Get column information for a table.
     *
     * @return array<string, array{type: string, nullable: bool, default: mixed}>
     */
    public function getTableSchema(string $table): array
    {
        $cacheKey = "mcp_schema_{$table}";

        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($table): array {
            $columns = Schema::getColumns($table);
            $schema = [];

            foreach ($columns as $column) {
                $schema[$column['name']] = [
                    'type' => $this->mapColumnType($column['type_name']),
                    'nullable' => $column['nullable'],
                    'default' => $column['default'],
                ];
            }

            return $schema;
        });
    }

    /**
     * Get enum values for a column.
     *
     * @return array<string>|null
     */
    public function getEnumValues(string $table, string $column): ?array
    {
        $cacheKey = "mcp_enum_{$table}_{$column}";

        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($table, $column): ?array {
            // For PostgreSQL
            if (DB::connection()->getDriverName() === 'pgsql') {
                try {
                    $result = DB::select('
                        SELECT enumlabel
                        FROM pg_enum
                        JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
                        WHERE pg_type.typname = ?
                    ', ["{$table}_{$column}"]);

                    if (! empty($result)) {
                        return array_column($result, 'enumlabel');
                    }
                } catch (\Throwable) {
                    // Fall through to return null
                }
            }

            // For MySQL, we could parse the column type string
            // But Ballistic uses PostgreSQL, so we'll handle enums via model constants

            return null;
        });
    }

    /**
     * Build a ToolInputSchema from model fillable fields.
     *
     * @param  class-string<Model>  $modelClass
     * @param  array<string>  $only  Only include these fields
     * @param  array<string>  $except  Exclude these fields
     * @param  array<string>  $required  Mark these fields as required
     * @param  array<string, string>  $descriptions  Field descriptions
     */
    public function buildSchemaFromModel(
        string $modelClass,
        array $only = [],
        array $except = [],
        array $required = [],
        array $descriptions = []
    ): ToolInputSchema {
        /** @var Model $model */
        $model = new $modelClass;
        $table = $model->getTable();
        $fillable = $model->getFillable();

        $tableSchema = $this->getTableSchema($table);
        $schema = new ToolInputSchema;

        $fields = ! empty($only) ? array_intersect($fillable, $only) : $fillable;
        $fields = array_diff($fields, $except);

        foreach ($fields as $field) {
            if (! isset($tableSchema[$field])) {
                continue;
            }

            $columnInfo = $tableSchema[$field];
            $type = $columnInfo['type'];

            // Add field to schema based on type
            match ($type) {
                'integer' => $schema->integer($field),
                'number' => $schema->number($field),
                'boolean' => $schema->boolean($field),
                default => $schema->string($field),
            };

            // Add description if provided
            if (isset($descriptions[$field])) {
                $schema->description($descriptions[$field]);
            }

            // Mark as required if in required list
            if (in_array($field, $required, true)) {
                $schema->required();
            }
        }

        return $schema;
    }

    /**
     * Clear cached schema for a table.
     */
    public function clearCache(string $table): void
    {
        Cache::forget("mcp_schema_{$table}");
    }

    /**
     * Clear all MCP schema caches.
     */
    public function clearAllCaches(): void
    {
        // This would need a cache tag implementation for proper clearing
        // For now, we rely on TTL expiration
    }

    /**
     * Map database column type to JSON Schema type.
     */
    private function mapColumnType(string $dbType): string
    {
        $normalised = strtolower(preg_replace('/\(.*\)/', '', $dbType) ?? $dbType);

        return self::TYPE_MAP[$normalised] ?? 'string';
    }

    /**
     * Get all fields that can be updated by an assignee.
     *
     * @return array<string>
     */
    public function getAssigneeUpdatableFields(): array
    {
        return ['status', 'assignee_notes', 'assignee_id'];
    }

    /**
     * Get item status enum values.
     *
     * @return array<string>
     */
    public function getItemStatuses(): array
    {
        return ['todo', 'doing', 'done', 'wontdo'];
    }

    /**
     * Get recurrence strategy enum values.
     *
     * @return array<string>
     */
    public function getRecurrenceStrategies(): array
    {
        return ['expires', 'carry_over'];
    }
}

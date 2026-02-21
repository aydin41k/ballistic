<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Legacy Wildcard Cutoff
    |--------------------------------------------------------------------------
    |
    | Legacy Sanctum wildcard tokens ("*") can temporarily access MCP until
    | this timestamp. After the cutoff, only tokens with "mcp:*" are accepted.
    | Leave empty to disable the grace period entirely (secure default).
    |
    */

    'legacy_wildcard_cutoff_at' => env('MCP_LEGACY_WILDCARD_CUTOFF_AT'),

];

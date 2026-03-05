<?php

declare(strict_types=1);

namespace Tests\Feature\Admin;

use Tests\TestCase;

/**
 * Regression guard for the Admin Dashboard production blocker.
 *
 * Root cause: resources/views/app.blade.php previously passed a per-page entry
 * string ("resources/js/pages/{$page['component']}.tsx") to the @vite() directive.
 * In production, @vite() resolves assets via public/build/manifest.json. Only
 * files listed under laravel({ input: [...] }) in vite.config.ts become manifest
 * entry points. Page components are dynamic chunks produced by import.meta.glob
 * in app.tsx — they are not entries — so @vite() threw
 * "Unable to locate file in Vite manifest" in production. It worked locally
 * because the Vite dev server transforms any file on-the-fly.
 *
 * The fix is to let app.tsx (via resolvePageComponent + import.meta.glob) handle
 * all page-chunk resolution. The Blade template must only reference declared entry
 * points (resources/js/app.tsx). These tests lock in the correct configuration.
 */
final class AdminViteManifestTest extends TestCase
{
    public function test_blade_template_does_not_reference_per_page_vite_entries(): void
    {
        $blade = file_get_contents(resource_path('views/app.blade.php'));
        // Strip Blade comments so explanatory docs referencing the anti-pattern
        // don't trigger false positives.
        $blade = preg_replace('/\{\{--.*?--\}\}/s', '', $blade);

        // A per-page @vite entry (e.g. "resources/js/pages/{$page['component']}.tsx")
        // will break production builds because those paths are not manifest entries.
        $this->assertDoesNotMatchRegularExpression(
            '/@vite\s*\([^)]*resources\/js\/pages\//',
            $blade,
            'app.blade.php must not pass per-page paths to @vite(). Page chunks are resolved by app.tsx via import.meta.glob — they are not Vite manifest entries and will fail in production.'
        );
        $this->assertStringNotContainsString(
            "\$page['component']",
            $blade,
            'app.blade.php must not interpolate the Inertia page component into @vite(). This breaks production because only declared vite.config.ts inputs exist in the manifest.'
        );
    }

    public function test_app_tsx_globs_all_page_components(): void
    {
        // app.tsx is the sole Inertia entry point and must import all pages via
        // import.meta.glob so Vite emits them as chunks and they resolve at runtime.
        $appTsx = file_get_contents(resource_path('js/app.tsx'));

        $this->assertStringContainsString(
            "import.meta.glob('./pages/**/*.tsx')",
            $appTsx,
            'app.tsx must use import.meta.glob to lazy-load all page components. Without it, Inertia pages will fail to resolve.'
        );
    }

    public function test_vite_config_only_declares_app_entry(): void
    {
        // If someone adds per-page files to vite.config.ts input[], the build
        // becomes bloated and coupled to file layout. Entry list should remain
        // minimal: CSS + app.tsx (and ssr.tsx for the ssr key).
        $config = file_get_contents(base_path('vite.config.ts'));

        $this->assertMatchesRegularExpression(
            "/input:\s*\[\s*'resources\/css\/app\.css',\s*'resources\/js\/app\.tsx'\s*\]/",
            $config,
            'vite.config.ts should only declare app.css + app.tsx as input entries. Page components are chunks, not entries.'
        );
    }
}

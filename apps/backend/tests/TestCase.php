<?php

declare(strict_types=1);

namespace Tests;

use Illuminate\Foundation\Http\Middleware\PreventRequestForgery;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    use CreatesApplication;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();

        // Disable CSRF middleware across Laravel versions during feature tests.
        $this->withoutMiddleware([
            PreventRequestForgery::class,
            VerifyCsrfToken::class,
            ValidateCsrfToken::class,
        ]);
    }
}

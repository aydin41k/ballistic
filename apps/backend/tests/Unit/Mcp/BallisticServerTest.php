<?php

declare(strict_types=1);

namespace Tests\Unit\Mcp;

use App\Mcp\Servers\BallisticServer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Mcp\Server\Contracts\Transport\Transport;
use Laravel\Mcp\Server\Transport\StdioTransport;
use ReflectionProperty;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Tests\TestCase;

final class BallisticServerTest extends TestCase
{
    use RefreshDatabase;

    public function test_boot_allows_stdio_sessions_without_http_authentication(): void
    {
        $server = new BallisticServer;
        $this->setTransport($server, new StdioTransport);
        $server->boot();

        $this->addToAssertionCount(1);
    }

    public function test_boot_requires_authenticated_http_requests(): void
    {
        $server = new BallisticServer;
        $this->setTransport($server, new class implements Transport
        {
            public function onReceive(callable $handler): void {}

            public function send(string $message, ?string $sessionId = null): void {}

            public function run(): void {}

            public function sessionId(): ?string
            {
                return null;
            }

            public function stream(\Closure $stream): void
            {
                $stream();
            }
        });

        try {
            $server->boot();
            $this->fail('Expected boot() to reject unauthenticated HTTP requests.');
        } catch (HttpException $exception) {
            $this->assertSame(401, $exception->getStatusCode());
        }
    }

    private function setTransport(BallisticServer $server, Transport $transport): void
    {
        $property = new ReflectionProperty($server, 'transport');
        $property->setAccessible(true);
        $property->setValue($server, $transport);
    }
}

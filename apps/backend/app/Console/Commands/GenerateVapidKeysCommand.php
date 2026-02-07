<?php

declare(strict_types=1);

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Minishlink\WebPush\VAPID;

final class GenerateVapidKeysCommand extends Command
{
    protected $signature = 'webpush:generate-vapid';

    protected $description = 'Generate VAPID keys for Web Push notifications';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('Generating VAPID keys...');
        $this->newLine();

        $keys = VAPID::createVapidKeys();

        $this->info('Add these to your .env file:');
        $this->newLine();
        $this->line("VAPID_PUBLIC_KEY={$keys['publicKey']}");
        $this->line("VAPID_PRIVATE_KEY={$keys['privateKey']}");
        $this->newLine();

        $this->info('The public key should also be used in your frontend to subscribe to push notifications.');

        return self::SUCCESS;
    }
}

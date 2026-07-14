<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Wallet;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Tests\TestCase;

class DatabaseSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_database_seeder_creates_admin_and_wallets(): void
    {
        Artisan::call('db:seed');

        $adminPhone = env('AUTH_ADMIN_PHONE', '09944070000');
        $adminUser = User::where('phone_number', $adminPhone)->first();

        $this->assertNotNull($adminUser, 'The admin user should be created by the seeders.');
        $this->assertTrue($adminUser->wallet()->exists(), 'The admin user should have a wallet created by the seeders.');
        $this->assertTrue(Wallet::where('user_id', $adminUser->id)->where('status', 'active')->exists());

        $this->assertGreaterThanOrEqual(1, Wallet::count());
    }
}

<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        $this->call([
            RolesSeeder::class,
            MyanmarLocationsSeeder::class,
            AgentManagerSeeder::class,
            AgentSeeder::class,
            CustomerSeeder::class,
            WalletSeeder::class,
        ]);

        User::updateOrCreate(
            ['phone_number' => '09123456789'],
            [
                'full_name' => 'Test User',
                'email' => 'test@example.com',
                'status' => 'active',
                'role_id' => DB::table('roles')->where('name', 'customer')->value('id'),
            ]
        );
    }
}

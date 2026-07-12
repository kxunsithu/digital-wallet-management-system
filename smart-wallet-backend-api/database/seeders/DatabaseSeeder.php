<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Database\Seeders\AgentLevelConfigSeeder;
use Database\Seeders\CustomerLevelConfigSeeder;

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
            CustomerLevelConfigSeeder::class,
            AgentLevelConfigSeeder::class,
        ]);

        User::factory()->create([
            'full_name' => 'Test User',
            'phone_number' => '09123456789',
            'email' => 'test@example.com',
            'status' => 'active',
        ]);
    }
}

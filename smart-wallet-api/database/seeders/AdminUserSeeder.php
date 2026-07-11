<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use App\Models\Wallet;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        Role::firstOrCreate(['name' => 'admin'], ['description' => 'System administrator with full access']);
        Role::firstOrCreate(['name' => 'agent'], ['description' => 'Cash-in/cash-out agent']);
        Role::firstOrCreate(['name' => 'agent_manager'], ['description' => 'Agent manager who can create and manage agents']);
        Role::firstOrCreate(['name' => 'customer'], ['description' => 'Regular wallet user']);

        $adminRole = Role::where('name', 'admin')->first();
        $adminPhoneNumber = config('auth.admin_phone_number', '+959944074981');

        $admin = User::firstOrCreate(
            ['phone_number' => $adminPhoneNumber],
            [
                'role_id' => $adminRole->id,
                'full_name' => 'System Admin',
                'email' => 'admin@smartwallet.com',
                'status' => 'active',
                'is_phone_verified' => true,
                'is_pin_created' => true,
            ]
        );

        // Create admin PIN (default: 123456)
        if (!$admin->pin) {
            $admin->pin()->create([
                'pin_hash' => Hash::make('123456'),
                'last_changed_at' => now(),
            ]);
        }

        // Create admin wallet
        if (!$admin->wallet) {
            Wallet::create([
                'user_id' => $admin->id,
                'wallet_number' => 'W' . str_pad($admin->id, 10, '0', STR_PAD_LEFT),
                'balance' => 0,
                'currency' => 'MMK',
                'status' => 'active',
            ]);
        }
    }
}

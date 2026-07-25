<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Wallet;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class WalletSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $adminRoleId = DB::table('roles')->where('name', 'admin')->value('id');
        $managerRoleId = DB::table('roles')->where('name', 'agent_manager')->value('id');
        $agentRoleId = DB::table('roles')->where('name', 'agent')->value('id');
        $customerRoleId = DB::table('roles')->where('name', 'customer')->value('id');

        $adminPhone = env('AUTH_ADMIN_PHONE', '09944070000');
        $adminUser = User::updateOrCreate(
            ['phone_number' => $adminPhone],
            [
                'role_id' => $adminRoleId,
                'full_name' => 'System Administrator',
                'status' => 'active',
                'is_phone_verified' => true,
                'is_pin_created' => true,
            ]
        );

        $this->ensureWalletForUser(
            $adminUser,
            (float) env('ADMIN_INITIAL_WALLET_BALANCE', 1000000),
            'active'
        );

        $users = User::whereIn('role_id', [$managerRoleId, $agentRoleId, $customerRoleId])
            ->get();

        foreach ($users as $user) {
            $balance = 0;
            $status = 'active';

            if ($user->role_id == $managerRoleId) {
                $balance = 5000000;
            } elseif ($user->role_id == $agentRoleId) {
                $balance = 1500000;
            } elseif ($user->role_id == $customerRoleId) {
                $balance = 250000;
            }

            $this->ensureWalletForUser($user, $balance, $status);
        }
    }

    protected function ensureWalletForUser(User $user, float $balance, string $status): void
    {
        if (Wallet::where('user_id', $user->id)->exists()) {
            return;
        }

        Wallet::create([
            'user_id' => $user->id,
            'wallet_number' => 'WAL-' . strtoupper(Str::random(8)),
            'balance' => $balance,
            'status' => $status,
        ]);
    }
}

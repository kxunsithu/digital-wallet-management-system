<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

class WalletService
{
    /**
     * Resolve the admin user's wallet (fee income destination).
     */
    public function adminWallet(): ?object
    {
        $adminRoleId = DB::table('roles')->where('name', 'admin')->value('id');
        if (! $adminRoleId) {
            return null;
        }

        $adminUserId = DB::table('users')->where('role_id', $adminRoleId)->orderBy('id')->value('id');
        if (! $adminUserId) {
            return null;
        }

        return DB::table('wallets')->where('user_id', $adminUserId)->first();
    }
}

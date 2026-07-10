<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Wallet;

class WalletPolicy
{
    /**
     * Determine if the user can view the wallet.
     */
    public function view(User $user, Wallet $wallet): bool
    {
        return $user->id === $wallet->user_id;
    }

    /**
     * Determine if the user can perform transfers from this wallet.
     */
    public function transfer(User $user, Wallet $wallet): bool
    {
        return $user->id === $wallet->user_id
            && $wallet->isActive()
            && $user->status === 'active';
    }

    /**
     * Determine if the user can view transactions for this wallet.
     */
    public function viewTransactions(User $user, Wallet $wallet): bool
    {
        return $user->id === $wallet->user_id;
    }
}

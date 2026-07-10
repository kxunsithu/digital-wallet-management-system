<?php

namespace App\Policies;

use App\Models\Transaction;
use App\Models\User;

class TransactionPolicy
{
    /**
     * Determine if the user can view the transaction.
     */
    public function view(User $user, Transaction $transaction): bool
    {
        $wallet = $user->wallet;

        if (!$wallet) {
            return false;
        }

        return $transaction->sender_wallet_id === $wallet->id
            || $transaction->receiver_wallet_id === $wallet->id
            || $transaction->agent_id === $user->id;
    }

    /**
     * Determine if the user can create a transfer transaction.
     */
    public function create(User $user): bool
    {
        return $user->status === 'active'
            && $user->is_pin_created
            && $user->wallet
            && $user->wallet->isActive();
    }
}

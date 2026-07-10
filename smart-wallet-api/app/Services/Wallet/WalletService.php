<?php

namespace App\Services\Wallet;

use App\Models\Transaction;
use App\Models\User;
use App\Models\Wallet;

class WalletService
{
    public function __construct(
        protected LimitCheckService $limitCheckService
    ) {}

    /**
     * Get wallet info with effective limits and remaining balances.
     */
    public function getWalletInfo(User $user): array
    {
        $wallet = $user->wallet;

        if (!$wallet) {
            return [
                'success' => false,
                'message' => 'Wallet not found.',
                'data' => [],
            ];
        }

        $limits = $this->limitCheckService->getLimitSummary($user);

        return [
            'success' => true,
            'message' => 'Wallet info retrieved.',
            'data' => [
                'wallet' => [
                    'wallet_number' => $wallet->wallet_number,
                    'balance' => $wallet->balance,
                    'currency' => $wallet->currency,
                    'status' => $wallet->status,
                ],
                'limits' => $limits,
            ],
        ];
    }

    /**
     * Get paginated transactions for a user.
     */
    public function getTransactions(User $user, array $filters = [], int $perPage = 15)
    {
        $wallet = $user->wallet;

        if (!$wallet) {
            return null;
        }

        $query = Transaction::where(function ($q) use ($wallet) {
            $q->where('sender_wallet_id', $wallet->id)
              ->orWhere('receiver_wallet_id', $wallet->id);
        });

        // Apply filters
        if (isset($filters['type'])) {
            $query->where('transaction_type', $filters['type']);
        }

        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (isset($filters['date_from'])) {
            $query->whereDate('created_at', '>=', $filters['date_from']);
        }

        if (isset($filters['date_to'])) {
            $query->whereDate('created_at', '<=', $filters['date_to']);
        }

        return $query->with(['senderWallet.user', 'receiverWallet.user'])
            ->latest()
            ->paginate($perPage);
    }
}

<?php

namespace App\Services\Wallet;

use App\Exceptions\TransactionLimitExceededException;
use App\Models\CustomerProfile;
use App\Models\Transaction;
use App\Models\User;
use Carbon\Carbon;

class LimitCheckService
{
    /**
     * Check if a transfer amount is within the user's daily limit.
     *
     * @throws TransactionLimitExceededException
     */
    public function checkDailyTransferLimit(User $user, float $amount): void
    {
        $profile = $user->customerProfile;

        if (!$profile) {
            return; // Admins/agents without customer profiles skip this check
        }

        $dailyLimit = $profile->effective_daily_transfer_limit;
        $dailyUsed = $this->getDailyTransferUsed($user);

        if (($dailyUsed + $amount) > $dailyLimit) {
            throw new TransactionLimitExceededException(
                'daily_transfer',
                $dailyLimit,
                $dailyUsed
            );
        }
    }

    /**
     * Check if a transfer amount is within the user's monthly limit.
     *
     * @throws TransactionLimitExceededException
     */
    public function checkMonthlyTransferLimit(User $user, float $amount): void
    {
        $profile = $user->customerProfile;

        if (!$profile) {
            return;
        }

        $monthlyLimit = $profile->effective_monthly_transfer_limit;
        $monthlyUsed = $this->getMonthlyTransferUsed($user);

        if (($monthlyUsed + $amount) > $monthlyLimit) {
            throw new TransactionLimitExceededException(
                'monthly_transfer',
                $monthlyLimit,
                $monthlyUsed
            );
        }
    }

    /**
     * Check daily transaction count.
     *
     * @throws TransactionLimitExceededException
     */
    public function checkDailyTransactionCount(User $user): void
    {
        $profile = $user->customerProfile;

        if (!$profile || !$profile->levelConfig) {
            return;
        }

        $maxCount = $profile->levelConfig->max_transaction_count_daily;
        $todayCount = $this->getDailyTransactionCount($user);

        if ($todayCount >= $maxCount) {
            throw new TransactionLimitExceededException(
                'daily_transaction_count',
                $maxCount,
                $todayCount
            );
        }
    }

    /**
     * Check daily cash out limit.
     *
     * @throws TransactionLimitExceededException
     */
    public function checkDailyCashOutLimit(User $user, float $amount): void
    {
        $profile = $user->customerProfile;

        if (!$profile) {
            return;
        }

        $dailyLimit = $profile->effective_daily_cash_out_limit;
        $dailyUsed = $this->getDailyCashOutUsed($user);

        if (($dailyUsed + $amount) > $dailyLimit) {
            throw new TransactionLimitExceededException(
                'daily_cash_out',
                $dailyLimit,
                $dailyUsed
            );
        }
    }

    /**
     * Check max wallet balance for the receiver.
     *
     * @throws TransactionLimitExceededException
     */
    public function checkMaxWalletBalance(User $user, float $incomingAmount): void
    {
        $profile = $user->customerProfile;

        if (!$profile) {
            return;
        }

        $maxBalance = $profile->effective_max_wallet_balance;
        $currentBalance = $user->wallet->balance ?? 0;

        if (($currentBalance + $incomingAmount) > $maxBalance) {
            throw new TransactionLimitExceededException(
                'max_wallet_balance',
                $maxBalance,
                $currentBalance
            );
        }
    }

    /**
     * Run all transfer limit checks.
     *
     * @throws TransactionLimitExceededException
     */
    public function checkAllTransferLimits(User $sender, float $amount, ?User $receiver = null): void
    {
        $this->checkDailyTransferLimit($sender, $amount);
        $this->checkMonthlyTransferLimit($sender, $amount);
        $this->checkDailyTransactionCount($sender);

        if ($receiver) {
            $this->checkMaxWalletBalance($receiver, $amount);
        }
    }

    /**
     * Get the user's effective limits and usage for display.
     */
    public function getLimitSummary(User $user): array
    {
        $profile = $user->customerProfile;

        if (!$profile || !$profile->levelConfig) {
            return [];
        }

        $dailyTransferLimit = $profile->effective_daily_transfer_limit;
        $monthlyTransferLimit = $profile->effective_monthly_transfer_limit;
        $dailyCashOutLimit = $profile->effective_daily_cash_out_limit;
        $dailyTransferUsed = $this->getDailyTransferUsed($user);
        $monthlyTransferUsed = $this->getMonthlyTransferUsed($user);
        $dailyCashOutUsed = $this->getDailyCashOutUsed($user);

        return [
            'level' => $profile->level,
            'daily_transfer_limit' => $dailyTransferLimit,
            'daily_transfer_used' => $dailyTransferUsed,
            'daily_transfer_remaining' => max(0, $dailyTransferLimit - $dailyTransferUsed),
            'monthly_transfer_limit' => $monthlyTransferLimit,
            'monthly_transfer_used' => $monthlyTransferUsed,
            'monthly_transfer_remaining' => max(0, $monthlyTransferLimit - $monthlyTransferUsed),
            'daily_cash_out_limit' => $dailyCashOutLimit,
            'daily_cash_out_used' => $dailyCashOutUsed,
            'daily_cash_out_remaining' => max(0, $dailyCashOutLimit - $dailyCashOutUsed),
            'max_wallet_balance' => $profile->effective_max_wallet_balance,
            'max_transaction_count_daily' => $profile->levelConfig->max_transaction_count_daily,
            'transaction_count_today' => $this->getDailyTransactionCount($user),
        ];
    }

    // ── Private helpers ──

    protected function getDailyTransferUsed(User $user): float
    {
        return (float) Transaction::where('sender_wallet_id', $user->wallet?->id)
            ->whereIn('transaction_type', ['transfer', 'qr_payment'])
            ->where('status', 'success')
            ->whereDate('created_at', Carbon::today())
            ->sum('amount');
    }

    protected function getMonthlyTransferUsed(User $user): float
    {
        return (float) Transaction::where('sender_wallet_id', $user->wallet?->id)
            ->whereIn('transaction_type', ['transfer', 'qr_payment'])
            ->where('status', 'success')
            ->whereMonth('created_at', Carbon::now()->month)
            ->whereYear('created_at', Carbon::now()->year)
            ->sum('amount');
    }

    protected function getDailyCashOutUsed(User $user): float
    {
        return (float) Transaction::where('sender_wallet_id', $user->wallet?->id)
            ->where('transaction_type', 'cash_out')
            ->where('status', 'success')
            ->whereDate('created_at', Carbon::today())
            ->sum('amount');
    }

    protected function getDailyTransactionCount(User $user): int
    {
        return Transaction::where('sender_wallet_id', $user->wallet?->id)
            ->where('status', 'success')
            ->whereDate('created_at', Carbon::today())
            ->count();
    }
}

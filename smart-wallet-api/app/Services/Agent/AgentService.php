<?php

namespace App\Services\Agent;

use App\Exceptions\InsufficientBalanceException;
use App\Exceptions\TransactionLimitExceededException;
use App\Models\AgentProfile;
use App\Models\Transaction;
use App\Models\User;
use App\Models\Wallet;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AgentService
{
    /**
     * Process a cash-in (agent deposits money into customer's wallet).
     */
    public function cashIn(User $agent, string $customerWalletNumber, float $amount): array
    {
        $agentProfile = $agent->agentProfile;

        if (!$agentProfile || $agentProfile->status !== 'active') {
            return [
                'success' => false,
                'message' => 'Agent profile is not active.',
                'data' => [],
            ];
        }

        // Check agent's daily cash limit
        $this->checkAgentDailyLimit($agentProfile, $amount);

        // Check float balance
        if ((float) $agentProfile->float_balance < $amount) {
            throw new InsufficientBalanceException(
                (float) $agentProfile->float_balance,
                $amount,
                'Insufficient agent float balance.'
            );
        }

        $customerWallet = Wallet::where('wallet_number', $customerWalletNumber)
            ->with('user.customerProfile.levelConfig')
            ->first();

        if (!$customerWallet || !$customerWallet->isActive()) {
            return [
                'success' => false,
                'message' => 'Customer wallet not found or not active.',
                'data' => [],
            ];
        }

        // Check if customer can receive from agent
        $customerProfile = $customerWallet->user->customerProfile;
        if ($customerProfile && $customerProfile->levelConfig && !$customerProfile->levelConfig->can_receive_from_agent) {
            return [
                'success' => false,
                'message' => 'Customer level does not allow receiving from agents.',
                'data' => [],
            ];
        }

        // Calculate commission
        $commissionRate = $agentProfile->effective_commission_rate;
        $commission = round($amount * ($commissionRate / 100), 2);

        // Execute atomic cash-in
        $transaction = DB::transaction(function () use ($agentProfile, $customerWallet, $amount, $commission, $agent) {
            $customerWallet = Wallet::lockForUpdate()->find($customerWallet->id);

            // Deduct from agent float
            $agentProfile->decrement('float_balance', $amount);

            // Credit customer wallet
            $customerWallet->increment('balance', $amount);

            // Track monthly volume
            $agentProfile->increment('total_volume_monthly', $amount);

            return Transaction::create([
                'transaction_ref' => 'CIN' . strtoupper(Str::random(12)),
                'sender_wallet_id' => null,
                'receiver_wallet_id' => $customerWallet->id,
                'transaction_type' => 'cash_in',
                'amount' => $amount,
                'fee' => $commission,
                'agent_id' => $agent->id,
                'status' => 'success',
                'pin_verified' => false,
                'description' => 'Cash-in by agent ' . $agentProfile->agent_code,
            ]);
        });

        return [
            'success' => true,
            'message' => 'Cash-in completed successfully.',
            'data' => [
                'transaction_ref' => $transaction->transaction_ref,
                'amount' => $transaction->amount,
                'commission' => $commission,
                'customer_wallet' => $customerWallet->wallet_number,
                'agent_float_balance' => $agentProfile->fresh()->float_balance,
                'status' => $transaction->status,
                'created_at' => $transaction->created_at->toISOString(),
            ],
        ];
    }

    /**
     * Process a cash-out (customer withdraws money via agent).
     */
    public function cashOut(User $agent, string $customerWalletNumber, float $amount, string $customerPin): array
    {
        $agentProfile = $agent->agentProfile;

        if (!$agentProfile || $agentProfile->status !== 'active') {
            return [
                'success' => false,
                'message' => 'Agent profile is not active.',
                'data' => [],
            ];
        }

        // Check agent's daily cash limit
        $this->checkAgentDailyLimit($agentProfile, $amount);

        $customerWallet = Wallet::where('wallet_number', $customerWalletNumber)
            ->with('user')
            ->first();

        if (!$customerWallet || !$customerWallet->isActive()) {
            return [
                'success' => false,
                'message' => 'Customer wallet not found or not active.',
                'data' => [],
            ];
        }

        // Verify customer's PIN
        $pinService = app(\App\Services\Auth\PinService::class);
        $pinResult = $pinService->verifyPin($customerWallet->user, $customerPin);
        if (!$pinResult['success']) {
            return [
                'success' => false,
                'message' => $pinResult['message'],
                'data' => [],
            ];
        }

        // Check customer balance
        if ((float) $customerWallet->balance < $amount) {
            throw new InsufficientBalanceException(
                (float) $customerWallet->balance,
                $amount
            );
        }

        // Calculate commission
        $commissionRate = $agentProfile->effective_commission_rate;
        $commission = round($amount * ($commissionRate / 100), 2);

        // Execute atomic cash-out
        $transaction = DB::transaction(function () use ($agentProfile, $customerWallet, $amount, $commission, $agent) {
            $customerWallet = Wallet::lockForUpdate()->find($customerWallet->id);

            // Deduct from customer wallet
            $customerWallet->decrement('balance', $amount);

            // Add to agent float
            $agentProfile->increment('float_balance', $amount);

            // Track monthly volume
            $agentProfile->increment('total_volume_monthly', $amount);

            return Transaction::create([
                'transaction_ref' => 'COT' . strtoupper(Str::random(12)),
                'sender_wallet_id' => $customerWallet->id,
                'receiver_wallet_id' => null,
                'transaction_type' => 'cash_out',
                'amount' => $amount,
                'fee' => $commission,
                'agent_id' => $agent->id,
                'status' => 'success',
                'pin_verified' => true,
                'description' => 'Cash-out via agent ' . $agentProfile->agent_code,
            ]);
        });

        return [
            'success' => true,
            'message' => 'Cash-out completed successfully.',
            'data' => [
                'transaction_ref' => $transaction->transaction_ref,
                'amount' => $transaction->amount,
                'commission' => $commission,
                'customer_wallet' => $customerWallet->wallet_number,
                'agent_float_balance' => $agentProfile->fresh()->float_balance,
                'status' => $transaction->status,
                'created_at' => $transaction->created_at->toISOString(),
            ],
        ];
    }

    /**
     * Get agent transactions (paginated).
     */
    public function getTransactions(User $agent, array $filters = [], int $perPage = 15)
    {
        $query = Transaction::where('agent_id', $agent->id)
            ->with(['senderWallet.user', 'receiverWallet.user']);

        if (isset($filters['type'])) {
            $query->where('transaction_type', $filters['type']);
        }

        if (isset($filters['date_from'])) {
            $query->whereDate('created_at', '>=', $filters['date_from']);
        }

        if (isset($filters['date_to'])) {
            $query->whereDate('created_at', '<=', $filters['date_to']);
        }

        return $query->latest()->paginate($perPage);
    }

    /**
     * Get agent profile with effective limits.
     */
    public function getProfile(User $agent): array
    {
        $agentProfile = $agent->agentProfile;

        if (!$agentProfile) {
            return [
                'success' => false,
                'message' => 'Agent profile not found.',
                'data' => [],
            ];
        }

        $agentProfile->load('levelConfig');
        $dailyCashUsed = $this->getDailyCashUsed($agent);

        return [
            'success' => true,
            'message' => 'Agent profile retrieved.',
            'data' => [
                'agent_code' => $agentProfile->agent_code,
                'level' => $agentProfile->level,
                'shop_name' => $agentProfile->shop_name,
                'shop_address' => $agentProfile->shop_address,
                'township' => $agentProfile->township,
                'float_balance' => $agentProfile->float_balance,
                'status' => $agentProfile->status,
                'commission_rate' => $agentProfile->effective_commission_rate,
                'daily_cash_limit' => $agentProfile->effective_daily_cash_limit,
                'daily_cash_used' => $dailyCashUsed,
                'daily_cash_remaining' => max(0, $agentProfile->effective_daily_cash_limit - $dailyCashUsed),
                'total_volume_monthly' => $agentProfile->total_volume_monthly,
                'can_recruit_sub_agent' => $agentProfile->levelConfig?->can_recruit_sub_agent ?? false,
            ],
        ];
    }

    /**
     * Check agent's daily cash limit.
     *
     * @throws TransactionLimitExceededException
     */
    protected function checkAgentDailyLimit(AgentProfile $agentProfile, float $amount): void
    {
        $dailyLimit = $agentProfile->effective_daily_cash_limit;
        $dailyUsed = $this->getDailyCashUsedByProfile($agentProfile);

        if (($dailyUsed + $amount) > $dailyLimit) {
            throw new TransactionLimitExceededException(
                'agent_daily_cash',
                $dailyLimit,
                $dailyUsed
            );
        }
    }

    protected function getDailyCashUsed(User $agent): float
    {
        return (float) Transaction::where('agent_id', $agent->id)
            ->whereIn('transaction_type', ['cash_in', 'cash_out'])
            ->where('status', 'success')
            ->whereDate('created_at', Carbon::today())
            ->sum('amount');
    }

    protected function getDailyCashUsedByProfile(AgentProfile $agentProfile): float
    {
        return (float) Transaction::where('agent_id', $agentProfile->user_id)
            ->whereIn('transaction_type', ['cash_in', 'cash_out'])
            ->where('status', 'success')
            ->whereDate('created_at', Carbon::today())
            ->sum('amount');
    }
}

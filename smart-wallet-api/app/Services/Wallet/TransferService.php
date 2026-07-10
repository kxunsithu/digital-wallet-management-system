<?php

namespace App\Services\Wallet;

use App\Exceptions\InsufficientBalanceException;
use App\Models\Transaction;
use App\Models\User;
use App\Models\Wallet;
use App\Services\Auth\PinService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class TransferService
{
    public function __construct(
        protected LimitCheckService $limitCheckService,
        protected PinService $pinService
    ) {}

    /**
     * Execute a wallet-to-wallet transfer.
     *
     * @throws InsufficientBalanceException
     * @throws \App\Exceptions\TransactionLimitExceededException
     */
    public function transfer(User $sender, string $receiverWalletNumber, float $amount, string $pin, ?string $description = null): array
    {
        // Verify sender's PIN
        $pinResult = $this->pinService->verifyPin($sender, $pin);
        if (!$pinResult['success']) {
            return [
                'success' => false,
                'message' => $pinResult['message'],
                'data' => [],
            ];
        }

        $senderWallet = $sender->wallet;

        if (!$senderWallet || !$senderWallet->isActive()) {
            return [
                'success' => false,
                'message' => 'Your wallet is not active.',
                'data' => [],
            ];
        }

        // Find receiver wallet
        $receiverWallet = Wallet::where('wallet_number', $receiverWalletNumber)->first();

        if (!$receiverWallet) {
            return [
                'success' => false,
                'message' => 'Receiver wallet not found.',
                'data' => [],
            ];
        }

        if (!$receiverWallet->isActive()) {
            return [
                'success' => false,
                'message' => 'Receiver wallet is not active.',
                'data' => [],
            ];
        }

        if ($senderWallet->id === $receiverWallet->id) {
            return [
                'success' => false,
                'message' => 'Cannot transfer to your own wallet.',
                'data' => [],
            ];
        }

        // Check sender balance
        if ((float) $senderWallet->balance < $amount) {
            throw new InsufficientBalanceException(
                (float) $senderWallet->balance,
                $amount
            );
        }

        // Check limits
        $receiver = $receiverWallet->user;
        $this->limitCheckService->checkAllTransferLimits($sender, $amount, $receiver);

        // Execute atomic transfer
        $transaction = DB::transaction(function () use ($senderWallet, $receiverWallet, $amount, $description) {
            // Debit sender (with pessimistic lock)
            $senderWallet = Wallet::lockForUpdate()->find($senderWallet->id);
            $receiverWallet = Wallet::lockForUpdate()->find($receiverWallet->id);

            $senderWallet->decrement('balance', $amount);
            $receiverWallet->increment('balance', $amount);

            // Create transaction record
            return Transaction::create([
                'transaction_ref' => 'TXN' . strtoupper(Str::random(12)),
                'sender_wallet_id' => $senderWallet->id,
                'receiver_wallet_id' => $receiverWallet->id,
                'transaction_type' => 'transfer',
                'amount' => $amount,
                'fee' => 0,
                'status' => 'success',
                'pin_verified' => true,
                'description' => $description,
            ]);
        });

        return [
            'success' => true,
            'message' => 'Transfer completed successfully.',
            'data' => [
                'transaction_ref' => $transaction->transaction_ref,
                'amount' => $transaction->amount,
                'fee' => $transaction->fee,
                'receiver_wallet' => $receiverWallet->wallet_number,
                'receiver_name' => $receiverWallet->user->full_name ?? 'N/A',
                'sender_balance' => $senderWallet->fresh()->balance,
                'status' => $transaction->status,
                'created_at' => $transaction->created_at->toISOString(),
            ],
        ];
    }
}

<?php

namespace App\Services\Qr;

use App\Exceptions\FeatureNotAvailableException;
use App\Exceptions\InsufficientBalanceException;
use App\Models\QrCode;
use App\Models\Transaction;
use App\Models\User;
use App\Models\Wallet;
use App\Services\Auth\PinService;
use App\Services\Wallet\LimitCheckService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class QrService
{
    public function __construct(
        protected PinService $pinService,
        protected LimitCheckService $limitCheckService
    ) {}

    /**
     * Generate a QR code (static or dynamic).
     */
    public function generate(User $user, string $type, ?float $amount = null): array
    {
        // Check if user's level allows QR payments
        $this->checkQrPermission($user);

        $wallet = $user->wallet;

        if (!$wallet || !$wallet->isActive()) {
            return [
                'success' => false,
                'message' => 'Active wallet is required to generate QR code.',
                'data' => [],
            ];
        }

        $qrCodeValue = 'QR' . strtoupper(Str::random(16));

        $qrCode = QrCode::create([
            'user_id' => $user->id,
            'wallet_id' => $wallet->id,
            'qr_type' => $type,
            'qr_code_value' => $qrCodeValue,
            'amount' => $type === 'dynamic' ? $amount : null,
            'is_active' => true,
            'expires_at' => $type === 'dynamic' ? now()->addMinutes(30) : null,
        ]);

        return [
            'success' => true,
            'message' => 'QR code generated successfully.',
            'data' => [
                'qr_code_value' => $qrCode->qr_code_value,
                'qr_type' => $qrCode->qr_type,
                'amount' => $qrCode->amount,
                'expires_at' => $qrCode->expires_at?->toISOString(),
                'wallet_number' => $wallet->wallet_number,
            ],
        ];
    }

    /**
     * Scan/resolve a QR code to get wallet information.
     */
    public function scan(string $qrCodeValue): array
    {
        $qrCode = QrCode::where('qr_code_value', $qrCodeValue)
            ->with(['wallet.user', 'user'])
            ->first();

        if (!$qrCode) {
            return [
                'success' => false,
                'message' => 'QR code not found.',
                'data' => [],
            ];
        }

        if (!$qrCode->isValid()) {
            return [
                'success' => false,
                'message' => 'QR code is invalid or expired.',
                'data' => [],
            ];
        }

        return [
            'success' => true,
            'message' => 'QR code resolved successfully.',
            'data' => [
                'qr_code_value' => $qrCode->qr_code_value,
                'qr_type' => $qrCode->qr_type,
                'amount' => $qrCode->amount,
                'receiver_wallet_number' => $qrCode->wallet->wallet_number,
                'receiver_name' => $qrCode->user->full_name ?? 'N/A',
            ],
        ];
    }

    /**
     * Process a QR payment.
     */
    public function pay(User $sender, string $qrCodeValue, float $amount, string $pin): array
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

        // Check QR permission
        $this->checkQrPermission($sender);

        $qrCode = QrCode::where('qr_code_value', $qrCodeValue)
            ->with(['wallet.user'])
            ->first();

        if (!$qrCode || !$qrCode->isValid()) {
            return [
                'success' => false,
                'message' => 'QR code is invalid or expired.',
                'data' => [],
            ];
        }

        // For dynamic QR, use the QR's set amount
        if ($qrCode->qr_type === 'dynamic' && $qrCode->amount) {
            $amount = (float) $qrCode->amount;
        }

        $senderWallet = $sender->wallet;
        $receiverWallet = $qrCode->wallet;

        if (!$senderWallet || !$senderWallet->isActive()) {
            return [
                'success' => false,
                'message' => 'Your wallet is not active.',
                'data' => [],
            ];
        }

        if ($senderWallet->id === $receiverWallet->id) {
            return [
                'success' => false,
                'message' => 'Cannot pay to your own QR code.',
                'data' => [],
            ];
        }

        if ((float) $senderWallet->balance < $amount) {
            throw new InsufficientBalanceException(
                (float) $senderWallet->balance,
                $amount
            );
        }

        // Check limits
        $receiver = $receiverWallet->user;
        $this->limitCheckService->checkAllTransferLimits($sender, $amount, $receiver);

        // Execute atomic payment
        $transaction = DB::transaction(function () use ($senderWallet, $receiverWallet, $amount, $qrCode) {
            $senderWallet = Wallet::lockForUpdate()->find($senderWallet->id);
            $receiverWallet = Wallet::lockForUpdate()->find($receiverWallet->id);

            $senderWallet->decrement('balance', $amount);
            $receiverWallet->increment('balance', $amount);

            // Deactivate dynamic QR after use
            if ($qrCode->qr_type === 'dynamic') {
                $qrCode->update(['is_active' => false]);
            }

            return Transaction::create([
                'transaction_ref' => 'QRP' . strtoupper(Str::random(12)),
                'sender_wallet_id' => $senderWallet->id,
                'receiver_wallet_id' => $receiverWallet->id,
                'transaction_type' => 'qr_payment',
                'amount' => $amount,
                'fee' => 0,
                'qr_id' => $qrCode->id,
                'status' => 'success',
                'pin_verified' => true,
                'description' => 'QR Payment',
            ]);
        });

        return [
            'success' => true,
            'message' => 'QR payment completed successfully.',
            'data' => [
                'transaction_ref' => $transaction->transaction_ref,
                'amount' => $transaction->amount,
                'receiver_wallet' => $receiverWallet->wallet_number,
                'receiver_name' => $receiverWallet->user->full_name ?? 'N/A',
                'sender_balance' => $senderWallet->fresh()->balance,
                'status' => $transaction->status,
                'created_at' => $transaction->created_at->toISOString(),
            ],
        ];
    }

    /**
     * Check if user's level allows QR payments.
     *
     * @throws FeatureNotAvailableException
     */
    protected function checkQrPermission(User $user): void
    {
        $profile = $user->customerProfile;

        if (!$profile || !$profile->levelConfig) {
            return;
        }

        if (!$profile->levelConfig->can_use_qr_payment) {
            throw new FeatureNotAvailableException('qr_payment', $profile->level);
        }
    }
}

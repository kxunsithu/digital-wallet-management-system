<?php

namespace App\Services;

use App\Http\Resources\TransactionResource;
use App\Models\ExternalPayment;
use App\Models\Transaction;
use App\Models\User;
use App\Traits\NormalizesPhoneNumber;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ExternalPaymentService
{
    use NormalizesPhoneNumber;

    public function __construct(
        private readonly OtpService $otpService,
        private readonly PinService $pinService,
        private readonly WalletService $walletService,
    ) {}

    public function findByReference(string $reference): ?ExternalPayment
    {
        return ExternalPayment::with(['customer', 'agent'])
            ->where('reference', $reference)
            ->first();
    }

    /**
     * Verify the OTP + PIN for a pending payment and execute the transfer.
     * Shared by the API confirm endpoint and the hosted payment page.
     */
    public function complete(ExternalPayment $payment, string $otp, string $pin): JsonResponse
    {
        if ($payment->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'This payment request is already '.$payment->status.'.',
            ], 400);
        }

        if ($payment->expires_at && Carbon::parse($payment->expires_at)->isPast()) {
            $payment->update(['status' => 'expired']);

            return response()->json(['success' => false, 'message' => 'This payment request has expired. Please initiate a new payment.'], 422);
        }

        $customer = $payment->customer;
        $agent = $payment->agent;

        if ($this->resolveUserRole($customer->id) !== 'customer' || $customer->status !== 'active') {
            return response()->json(['success' => false, 'message' => 'Customer account is no longer eligible to make payments.'], 422);
        }

        if ($this->resolveUserRole($agent->id) !== 'agent' || $agent->status !== 'active') {
            return response()->json(['success' => false, 'message' => 'Agent account is no longer eligible to receive payments.'], 422);
        }

        $purpose = 'external_payment:'.$payment->id;

        $otpResult = $this->otpService->verify($customer->id, $otp, $purpose);
        if ($otpResult !== true) {
            return response()->json(['success' => false, 'message' => $otpResult], 422);
        }

        if (! $this->pinService->verify($customer->id, $pin)) {
            return response()->json(['success' => false, 'message' => 'Invalid PIN.'], 422);
        }

        $result = DB::transaction(function () use ($payment, $customer, $agent) {
            $customerWallet = DB::table('wallets')->where('user_id', $customer->id)->lockForUpdate()->first();
            $agentWallet = DB::table('wallets')->where('user_id', $agent->id)->lockForUpdate()->first();

            if (! $customerWallet || ! $agentWallet) {
                return response()->json(['success' => false, 'message' => 'Wallet not found for the customer or agent.'], 422);
            }

            if (($customerWallet->status ?? 'active') !== 'active') {
                return response()->json(['success' => false, 'message' => 'Customer wallet is inactive.'], 422);
            }

            if (($agentWallet->status ?? 'active') !== 'active') {
                return response()->json(['success' => false, 'message' => 'Agent wallet is inactive.'], 422);
            }

            $amount = (float) $payment->amount;
            $fee = (float) $payment->fee;
            $total = round($amount + $fee, 2);

            if ((float) $customerWallet->balance < $total) {
                return response()->json(['success' => false, 'message' => 'Insufficient balance.'], 422);
            }

            DB::table('wallets')->where('id', $customerWallet->id)->decrement('balance', (string) $total);
            DB::table('wallets')->where('id', $agentWallet->id)->increment('balance', (string) $amount);

            if ($fee > 0) {
                $adminWallet = $this->walletService->adminWallet();
                if ($adminWallet && (int) $adminWallet->id !== (int) $customerWallet->id && (int) $adminWallet->id !== (int) $agentWallet->id) {
                    DB::table('wallets')->where('id', $adminWallet->id)->increment('balance', (string) $fee);
                }
            }

            $txId = DB::table('transactions')->insertGetId([
                'transaction_number' => 'TX'.Str::upper(Str::random(12)),
                'sender_wallet_id' => $customerWallet->id,
                'receiver_wallet_id' => $agentWallet->id,
                'receiver_phone' => $agent->phone_number,
                'transaction_type' => 'external_payment',
                'amount' => $amount,
                'fee' => $fee,
                'external_payment_id' => $payment->id,
                'agent_id' => $agent->id,
                'status' => 'completed',
                'pin_verified' => true,
                'description' => $payment->description ?? ('External payment '.$payment->reference),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $payment->update(['status' => 'completed', 'completed_at' => now()]);

            $tx = Transaction::with(['senderWallet.user', 'receiverWallet.user'])->find($txId);

            return response()->json([
                'success' => true,
                'message' => 'Payment completed successfully.',
                'data' => new TransactionResource($tx),
            ], 200);
        });

        if ($result->getStatusCode() === 200) {
            $this->otpService->markUsed($customer->id, $purpose);
        }

        return $result;
    }

    protected function resolveUserRole(int $userId): ?string
    {
        $roleId = DB::table('users')->where('id', $userId)->value('role_id');
        if (! $roleId) {
            return null;
        }

        return DB::table('roles')->where('id', $roleId)->value('name');
    }

    protected function findUserByPhone(string $phone): ?User
    {
        $localPhone = $this->normalizePhone($phone);
        $intlPhone = $this->phoneToInternational($localPhone);
        $rawPhone = ltrim($intlPhone, '+');

        return User::where('phone_number', $localPhone)
            ->orWhere('phone_number', $intlPhone)
            ->orWhere('phone_number', $rawPhone)
            ->orWhere('phone_number', $phone)
            ->first();
    }
}

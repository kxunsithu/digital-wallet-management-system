<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Transfer\TransferRequest;
use App\Http\Resources\TransactionResource;
use App\Models\AgentProfile;
use App\Models\CustomerProfile;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class MoneyTransferController extends Controller
{

    /**
     * Money transfer role rules:
     *
     * Allowed:
     * - customer -> customer
     * - customer -> agent
     * - agent -> customer
     * - agent -> agent_manager
     * - agent_manager -> agent
     * - agent_manager -> admin
     * - admin -> agent_manager
     *
     * Disallowed:
     * - admin -> customer
     * - customer -> admin
     * - admin -> agent
     * - agent -> admin
     * - agent_manager -> customer
     * - customer -> agent_manager
     */
    public function adminTransfer(TransferRequest $request): JsonResponse
    {
        $data = $request->validated();
        $authUser = $request->user();
        if (! $authUser) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        if (! $this->verifyPin($authUser->id, $data['pin'])) {
            return response()->json(['success' => false, 'message' => 'Invalid PIN.'], 422);
        }

        return $this->prepareAndExecute($authUser->id, $data, 'admin');
    }

    /**
     * Agent manager transfer to agent-only targets
     */
    public function managerTransfer(TransferRequest $request): JsonResponse
    {
        $data = $request->validated();
        $senderUser = $request->user();
        if (! $senderUser) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        if (! $this->verifyPin($senderUser->id, $data['pin'])) {
            return response()->json(['success' => false, 'message' => 'Invalid PIN.'], 422);
        }

        return $this->prepareAndExecute($senderUser->id, $data, 'manager');
    }

    /**
     * Agent transfer to agent or customer targets
     */
    public function agentTransfer(TransferRequest $request): JsonResponse
    {
        $data = $request->validated();
        $senderUser = $request->user();
        if (! $senderUser) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        if (! $this->verifyPin($senderUser->id, $data['pin'])) {
            return response()->json(['success' => false, 'message' => 'Invalid PIN.'], 422);
        }

        return $this->prepareAndExecute($senderUser->id, $data, 'agent');
    }

    /**
     * Customer transfer to agent or customer targets
     */
    public function customerTransfer(TransferRequest $request): JsonResponse
    {
        $data = $request->validated();
        $senderUser = $request->user();
        if (! $senderUser) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        $senderRole = $this->resolveUserRole($senderUser->id);
        if ($senderRole !== 'customer') {
            return response()->json(['success' => false, 'message' => 'Forbidden. Customer only.'], 403);
        }

        if (! $this->verifyPin($senderUser->id, $data['pin'])) {
            return response()->json(['success' => false, 'message' => 'Invalid PIN.'], 422);
        }

        return $this->prepareAndExecute($senderUser->id, $data, 'customer');
    }

    protected function prepareAndExecute(int $senderUserId, array $data, string $type): JsonResponse
    {
        $qrId = $data['qr_id'] ?? null;
        $receiverUserId = $data['receiver_user_id'] ?? null;
        $receiverPhone = $data['receiver_phone'] ?? null;
        $receiverWalletNumber = $data['receiver_wallet_number'] ?? null;
        $amount = $data['amount'] ?? null;
        $fee = $data['fee'] ?? 0;
        $description = $data['description'] ?? null;

        $senderStatus = $this->getUserStatus($senderUserId);
        if ($senderStatus !== 'active') {
            return response()->json([
                'success' => false,
                'message' => 'Sender account is '.$senderStatus.' and cannot send money.',
            ], 403);
        }

        if ($qrId) {
            $qr = DB::table('qr_codes')->where('id', $qrId)->first();
            if (! $qr) {
                return response()->json(['success' => false, 'message' => 'QR code not found.'], 422);
            }

            if (! $qr->is_active) {
                return response()->json(['success' => false, 'message' => 'QR code is inactive.'], 422);
            }

            if ($qr->expires_at && Carbon::parse($qr->expires_at)->isPast()) {
                return response()->json(['success' => false, 'message' => 'QR code has expired.'], 422);
            }

            // receiver from QR
            $receiverUserId = $qr->user_id;

            // if QR defines a fixed amount, use it
            if ($qr->amount !== null) {
                $amount = (float) $qr->amount;
            }
        }

        // If not using QR, allow receiver resolution by wallet number or phone
        if (! $qrId) {
            if ($receiverWalletNumber) {
                $wallet = DB::table('wallets')->where('wallet_number', $receiverWalletNumber)->first();
                if (! $wallet) {
                    return response()->json(['success' => false, 'message' => 'Receiver wallet not found.'], 422);
                }
                $receiverUserId = $wallet->user_id;
            } elseif ($receiverPhone) {
                $resolvedReceiverUserId = $this->resolveReceiverUserIdByPhone($receiverPhone);
                if ($resolvedReceiverUserId === null) {
                    return response()->json(['success' => false, 'message' => 'Receiver user not found for given phone.'], 422);
                }
                $receiverUserId = $resolvedReceiverUserId;
            }
        }

        if ($amount === null) {
            return response()->json(['success' => false, 'message' => 'Amount is required.'], 422);
        }

        if ($receiverUserId === null) {
            return response()->json(['success' => false, 'message' => 'Receiver not specified.'], 422);
        }

        $receiverStatus = $this->getUserStatus($receiverUserId);
        if ($receiverStatus !== 'active') {
            return response()->json([
                'success' => false,
                'message' => 'Receiver account is '.$receiverStatus.' and cannot receive money.',
            ], 403);
        }

        $senderRole = $this->resolveUserRole($senderUserId);
        $receiverRole = $this->resolveUserRole($receiverUserId);
        $transactionType = $this->determineTransferType($type, $senderRole, $receiverRole);
        if ($transactionType instanceof JsonResponse) {
            return $transactionType;
        }

        $createdRecipientError = $this->validateCreatedRecipient($senderUserId, $receiverUserId, $transactionType);
        if ($createdRecipientError) {
            return $createdRecipientError;
        }

        return $this->executeTransfer($senderUserId, $receiverUserId, $qrId, (float)$amount, (float)$fee, $description, $transactionType);
    }

    protected function resolveUserRole(int $userId): ?string
    {
        $roleId = DB::table('users')->where('id', $userId)->value('role_id');
        if (! $roleId) {
            return null;
        }

        return DB::table('roles')->where('id', $roleId)->value('name');
    }

    protected function getUserStatus(int $userId): string
    {
        $status = DB::table('users')->where('id', $userId)->value('status');

        return $status ?? 'inactive';
    }

    protected function determineTransferType(string $context, ?string $senderRole, ?string $receiverRole): JsonResponse|string
    {
        if ($context === 'admin') {
            if ($receiverRole === 'agent_manager') {
                return 'admin_to_agent_manager';
            }

            return response()->json(['success' => false, 'message' => 'Admin can only transfer to agent managers.'], 422);
        }

        if ($context === 'manager') {
            if ($receiverRole === 'agent') {
                return 'manager_to_agent';
            }
            if ($receiverRole === 'admin') {
                return 'manager_to_admin';
            }

            return response()->json(['success' => false, 'message' => 'Agent manager can only transfer to agents or admin.'], 422);
        }

        if ($context === 'agent') {
            if ($receiverRole === 'customer') {
                return 'agent_to_customer';
            }
            if ($receiverRole === 'agent_manager') {
                return 'agent_to_agent_manager';
            }

            return response()->json(['success' => false, 'message' => 'Agent can only transfer to customers or agent managers.'], 422);
        }

        if ($context === 'customer') {
            if ($receiverRole === 'customer') {
                return 'customer_to_customer';
            }
            if ($receiverRole === 'agent') {
                return 'customer_to_agent';
            }

            return response()->json(['success' => false, 'message' => 'Customer can only transfer to other customers or agents.'], 422);
        }

        return response()->json(['success' => false, 'message' => 'Invalid transfer context.'], 422);
    }

    protected function validateCreatedRecipient(int $senderUserId, ?int $receiverUserId, string $type): ?JsonResponse
    {
        if ($receiverUserId === null) {
            return null;
        }

        if ($type === 'manager_to_agent') {
            $receiverRole = $this->resolveUserRole($receiverUserId);
            if ($receiverRole !== 'agent') {
                return response()->json([
                    'success' => false,
                    'message' => 'Receiver must be an agent.',
                ], 403);
            }
        }

        if ($type === 'agent_to_agent_manager') {
            $ownsManager = DB::table('agent_profiles')
                ->where('user_id', $senderUserId)
                ->where('created_by_manager_id', $receiverUserId)
                ->exists();

            if (! $ownsManager) {
                return response()->json([
                    'success' => false,
                    'message' => 'Receiver must be the agent manager who created this agent.',
                ], 403);
            }
        }

        if ($type === 'agent_to_agent') {
            $senderProfile = DB::table('agent_profiles')->where('user_id', $senderUserId)->first();
            if (! $senderProfile) {
                return response()->json([
                    'success' => false,
                    'message' => 'Sender does not have an agent profile.',
                ], 403);
            }

            $allowed = DB::table('agent_profiles')
                ->where('parent_agent_id', $senderProfile->id)
                ->pluck('user_id')
                ->toArray();

            if (! in_array($receiverUserId, $allowed, true)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Receiver must be an agent created by this agent.',
                ], 403);
            }
        }

        return null;
    }

    protected function verifyPin(int $userId, string $pin): bool
    {
        $pinRecord = DB::table('pins')->where('user_id', $userId)->first();
        return $pinRecord && Hash::check($pin, $pinRecord->pin_hash);
    }

    protected function resolveReceiverUserIdByPhone(string $phone): ?int
    {
        $normalizedPhone = $this->normalizePhoneNumber($phone);
        $candidatePhones = array_values(array_unique(array_filter([
            trim($phone),
            $normalizedPhone,
            preg_replace('/[^\d]/', '', $phone),
            preg_replace('/[^\d]/', '', $normalizedPhone),
        ], fn ($value) => $value !== '')));

        $user = DB::table('users')->where(function ($query) use ($candidatePhones): void {
            foreach ($candidatePhones as $candidatePhone) {
                $query->orWhere('phone_number', $candidatePhone);
            }
        })->first();

        return $user ? (int) $user->id : null;
    }

    protected function normalizePhoneNumber(string $phone): string
    {
        $cleanPhone = preg_replace('/[^\d+]/', '', $phone) ?: '';
        if ($cleanPhone === '') {
            return '';
        }

        if (str_starts_with($cleanPhone, '+')) {
            return $cleanPhone;
        }

        if (str_starts_with($cleanPhone, '09')) {
            return '+959' . substr($cleanPhone, 2);
        }

        if (str_starts_with($cleanPhone, '959')) {
            return '+' . $cleanPhone;
        }

        return $cleanPhone;
    }



    protected function executeTransfer(int $senderUserId, int $receiverUserId = null, ?int $qrId = null, float $amount, float $fee, ?string $description, string $type): JsonResponse
    {
        if ($receiverUserId === null) {
            return response()->json(['success' => false, 'message' => 'Receiver not specified.'], 422);
        }

        if ($senderUserId === $receiverUserId) {
            return response()->json(['success' => false, 'message' => 'Sender and receiver must be different.'], 422);
        }

        return DB::transaction(function () use ($senderUserId, $receiverUserId, $qrId, $amount, $fee, $description, $type) {
            $senderWallet = DB::table('wallets')->where('user_id', $senderUserId)->lockForUpdate()->first();
            if ($qrId) {
                $qr = DB::table('qr_codes')->where('id', $qrId)->first();
                $receiverWallet = DB::table('wallets')->where('id', $qr->wallet_id)->lockForUpdate()->first();
            } else {
                $receiverWallet = DB::table('wallets')->where('user_id', $receiverUserId)->lockForUpdate()->first();
            }

            if (! $senderWallet || ! $receiverWallet) {
                return response()->json(['success' => false, 'message' => 'Wallet not found for sender or receiver.'], 422);
            }

            if (($senderWallet->status ?? 'active') !== 'active') {
                return response()->json(['success' => false, 'message' => 'Sender wallet is inactive.'], 422);
            }

            if (($receiverWallet->status ?? 'active') !== 'active') {
                return response()->json(['success' => false, 'message' => 'Receiver wallet is inactive.'], 422);
            }

            $total = round($amount + $fee, 2);
            if ((float) $senderWallet->balance < $total) {
                return response()->json(['success' => false, 'message' => 'Insufficient balance.'], 422);
            }

            // update balances
            DB::table('wallets')->where('id', $senderWallet->id)->update([
                'balance' => DB::raw('balance - '.(float)$total),
                'updated_at' => now(),
            ]);

            DB::table('wallets')->where('id', $receiverWallet->id)->update([
                'balance' => DB::raw('balance + '.(float)$amount),
                'updated_at' => now(),
            ]);

            $transactionRef = Str::upper('TX'.Str::random(12));

            $txId = DB::table('transactions')->insertGetId([
                'transaction_number' => $transactionRef,
                'sender_wallet_id' => $senderWallet->id,
                'receiver_wallet_id' => $receiverWallet->id,
                'transaction_type' => $type,
                'amount' => $amount,
                'fee' => $fee,
                'qr_id' => $qrId,
                'agent_id' => null,
                'status' => 'completed',
                'pin_verified' => true,
                'description' => $description,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $tx = \App\Models\Transaction::with(['senderWallet.user', 'receiverWallet.user'])->find($txId);


            return response()->json(['success' => true, 'message' => 'Transfer completed.', 'data' => new TransactionResource($tx)], 200);
        });
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Merchant\ConfirmPaymentRequest;
use App\Http\Requests\Merchant\InitiatePaymentRequest;
use App\Http\Requests\Merchant\StoreMerchantRequest;
use App\Http\Requests\Merchant\UpdateMerchantRequest;
use App\Http\Resources\MerchantResource;
use App\Http\Resources\TransactionResource;
use App\Models\CustomerProfile;
use App\Models\Merchant;
use App\Models\MerchantPayment;
use App\Models\Transaction;
use App\Models\User;
use App\Models\Wallet;
use App\Services\OtpService;
use App\Services\PinService;
use App\Services\TransferSettingsService;
use App\Services\WalletService;
use App\Traits\NormalizesPhoneNumber;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class MerchantController extends Controller
{
    use NormalizesPhoneNumber;

    public function __construct(
        private readonly OtpService $otpService,
        private readonly PinService $pinService,
        private readonly TransferSettingsService $settingsService,
        private readonly WalletService $walletService,
    ) {
    }

    // ────────────────────────────── Admin CRUD ──────────────────────────────

    public function index(Request $request): JsonResponse
    {
        $perPage = min(100, max(1, (int) $request->query('per_page', 15)));

        $query = Merchant::with(['user', 'wallet']);

        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('merchant_name', 'like', "%{$search}%")
                    ->orWhere('phone_number', 'like', "%{$search}%")
                    ->orWhereHas('user', fn ($uq) => $uq->where('full_name', 'like', "%{$search}%"));
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        $list = $query->orderBy('id', 'desc')->paginate($perPage);

        return MerchantResource::collection($list)
            ->additional(['success' => true])
            ->response()
            ->setStatusCode(200);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $merchant = Merchant::with(['user', 'wallet', 'payments'])->find($id);
        if (! $merchant) {
            return response()->json(['success' => false, 'message' => 'Merchant not found.'], 404);
        }

        return (new MerchantResource($merchant))
            ->additional(['success' => true])
            ->response()
            ->setStatusCode(200);
    }

    public function store(StoreMerchantRequest $request): JsonResponse
    {
        $data = $request->validated();

        return DB::transaction(function () use ($data): JsonResponse {
            $roleId = DB::table('roles')->where('name', 'merchant')->value('id');
            if (! $roleId) {
                return response()->json(['success' => false, 'message' => 'Merchant role is not configured.'], 500);
            }

            $user = User::create([
                'phone_number' => $data['phone_number'] ?? null,
                'role_id' => $roleId,
                'full_name' => $data['merchant_name'],
                'status' => 'active',
                'is_phone_verified' => true,
            ]);

            $merchant = Merchant::create([
                'user_id' => $user->id,
                'merchant_name' => $data['merchant_name'],
                'phone_number' => $data['phone_number'] ?? null,
                'api_key' => 'MCH-'.Str::upper(Str::random(32)),
                'callback_url' => $data['callback_url'] ?? null,
                'status' => 'active',
            ]);

            if (! Wallet::where('user_id', $user->id)->exists()) {
                Wallet::create([
                    'user_id' => $user->id,
                    'wallet_number' => 'WAL-'.strtoupper(bin2hex(random_bytes(4))),
                    'balance' => 0,
                    'status' => 'active',
                ]);
            }

            $fresh = $merchant->fresh(['user', 'wallet']);

            return response()->json([
                'success' => true,
                'message' => 'Merchant created.',
                'data' => [
                    'merchant' => (new MerchantResource($fresh))->resolve(),
                    'api_key' => $merchant->api_key,
                ],
            ], 201);
        });
    }

    public function update(UpdateMerchantRequest $request, int $id): JsonResponse
    {
        $merchant = Merchant::find($id);
        if (! $merchant) {
            return response()->json(['success' => false, 'message' => 'Merchant not found.'], 404);
        }

        $data = $request->validated();

        return DB::transaction(function () use ($merchant, $data): JsonResponse {
            $updates = [];
            if (array_key_exists('merchant_name', $data)) {
                $updates['merchant_name'] = $data['merchant_name'];
            }
            if (array_key_exists('callback_url', $data)) {
                $updates['callback_url'] = $data['callback_url'];
            }
            if (array_key_exists('status', $data)) {
                $updates['status'] = $data['status'];
            }

            $merchant->update($updates);

            if (array_key_exists('merchant_name', $data)) {
                $merchant->user()->update(['full_name' => $data['merchant_name']]);
            }

            if (array_key_exists('phone_number', $data)) {
                $merchant->user()->update(['phone_number' => $data['phone_number']]);
            }

            if (array_key_exists('status', $data) && in_array($data['status'], ['active', 'inactive'], true)) {
                $merchant->user()->update(['status' => $data['status'] === 'active' ? 'active' : 'inactive']);
            }

            return (new MerchantResource($merchant->fresh(['user', 'wallet'])))
                ->additional(['success' => true, 'message' => 'Merchant updated.'])
                ->response()
                ->setStatusCode(200);
        });
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $merchant = Merchant::find($id);
        if (! $merchant) {
            return response()->json(['success' => false, 'message' => 'Merchant not found.'], 404);
        }

        $user = $merchant->user;

        DB::beginTransaction();
        try {
            if ($user) {
                Wallet::where('user_id', $user->id)->delete();
                $merchant->delete();
                $user->delete();
            } else {
                $merchant->delete();
            }
            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();

            return response()->json(['success' => false, 'message' => 'Failed to delete merchant: '.$e->getMessage()], 500);
        }

        return response()->json(['success' => true, 'message' => 'Merchant deleted.'], 200);
    }

    public function toggleStatus(Request $request, int $id): JsonResponse
    {
        $merchant = Merchant::find($id);
        if (! $merchant) {
            return response()->json(['success' => false, 'message' => 'Merchant not found.'], 404);
        }

        $newStatus = $merchant->status === 'active' ? 'inactive' : 'active';
        $merchant->update(['status' => $newStatus]);
        $merchant->user()->update(['status' => $newStatus === 'active' ? 'active' : 'inactive']);

        return (new MerchantResource($merchant->fresh(['user', 'wallet'])))
            ->additional(['success' => true, 'message' => 'Merchant status updated.', 'status' => $newStatus])
            ->response()
            ->setStatusCode(200);
    }

    public function payments(Request $request, int $id): JsonResponse
    {
        $merchant = Merchant::find($id);
        if (! $merchant) {
            return response()->json(['success' => false, 'message' => 'Merchant not found.'], 404);
        }

        $perPage = min(100, max(1, (int) $request->query('per_page', 15)));
        $query = MerchantPayment::with(['merchant', 'customer', 'transaction'])
            ->where('merchant_id', $merchant->id);

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        $list = $query->orderBy('id', 'desc')->paginate($perPage);

        return response()->json(['success' => true, 'data' => $list], 200);
    }

    // ────────────────────────── Merchant API (X-API-Key) ────────────────────

    public function initiate(InitiatePaymentRequest $request): JsonResponse
    {
        $merchant = $request->attributes->get('merchant');
        $data = $request->validated();

        $customerUser = $this->findCustomerByPhone($data['customer_phone']);
        if (! $customerUser) {
            return response()->json(['success' => false, 'message' => 'Customer not found for the given phone number.'], 422);
        }

        if (($customerUser->status ?? 'inactive') !== 'active') {
            return response()->json(['success' => false, 'message' => 'Customer account is not active.'], 403);
        }

        $customerWallet = DB::table('wallets')->where('user_id', $customerUser->id)->first();
        if (! $customerWallet || ($customerWallet->status ?? 'inactive') !== 'active') {
            return response()->json(['success' => false, 'message' => 'Customer wallet is not active.'], 422);
        }

        $settings = $this->settingsService->get();
        $fee = round((float) $data['amount'] * (float) $settings->merchant_payment_fee_percent / 100, 2);

        $payment = MerchantPayment::create([
            'merchant_id' => (int) $merchant->id,
            'customer_user_id' => $customerUser->id,
            'amount' => $data['amount'],
            'fee' => $fee,
            'status' => 'pending',
            'reference' => $data['reference'] ?? null,
            'description' => $data['description'] ?? null,
            'expires_at' => Carbon::now()->addMinutes(10),
        ]);

        $otpResult = $this->otpService->issue($customerUser->id, $customerUser->phone_number, 'merchant_payment');

        return response()->json([
            'success' => true,
            'message' => $otpResult['message'],
            'data' => [
                'payment_id' => $payment->id,
                'customer_phone' => $customerUser->phone_number,
                'merchant_name' => $merchant->merchant_name,
                'amount' => (float) $payment->amount,
                'fee' => (float) $payment->fee,
                'total' => round((float) $payment->amount + (float) $payment->fee, 2),
                'reference' => $payment->reference,
                'status' => $payment->status,
                'expires_at' => $payment->expires_at?->toISOString(),
                'otp_code' => $otpResult['otp_code'],
            ],
        ], 200);
    }

    public function confirm(ConfirmPaymentRequest $request): JsonResponse
    {
        $merchant = $request->attributes->get('merchant');
        $data = $request->validated();

        $payment = MerchantPayment::with('merchant')->find($data['payment_id']);
        if (! $payment || (int) $payment->merchant_id !== (int) $merchant->id) {
            return response()->json(['success' => false, 'message' => 'Payment not found.'], 404);
        }

        if ($payment->status !== 'pending') {
            return response()->json(['success' => false, 'message' => 'Payment has already been processed.'], 422);
        }

        if ($payment->expires_at && Carbon::parse($payment->expires_at)->isPast()) {
            $payment->update(['status' => 'failed']);

            return response()->json(['success' => false, 'message' => 'Payment has expired. Please initiate again.'], 422);
        }

        $otpResult = $this->otpService->verify($payment->customer_user_id, $data['otp_code'], 'merchant_payment');
        if ($otpResult !== true) {
            return response()->json(['success' => false, 'message' => $otpResult], 422);
        }

        if (! $this->pinService->verify($payment->customer_user_id, $data['pin'])) {
            return response()->json(['success' => false, 'message' => 'Invalid PIN.'], 422);
        }

        $result = $this->executePayment($payment);
        if ($result instanceof JsonResponse) {
            return $result;
        }

        return response()->json([
            'success' => true,
            'message' => 'Payment completed.',
            'data' => new TransactionResource($result),
        ], 200);
    }

    protected function executePayment(MerchantPayment $payment): Transaction|JsonResponse
    {
        return DB::transaction(function () use ($payment) {
            $customerWallet = DB::table('wallets')->where('user_id', $payment->customer_user_id)->lockForUpdate()->first();
            $merchantWallet = DB::table('wallets')->where('user_id', $payment->merchant->user_id)->lockForUpdate()->first();

            if (! $customerWallet || ! $merchantWallet) {
                return response()->json(['success' => false, 'message' => 'Wallet not found for customer or merchant.'], 422);
            }

            if (($customerWallet->status ?? 'active') !== 'active') {
                return response()->json(['success' => false, 'message' => 'Customer wallet is inactive.'], 422);
            }

            if (($merchantWallet->status ?? 'active') !== 'active') {
                return response()->json(['success' => false, 'message' => 'Merchant wallet is inactive.'], 422);
            }

            $total = round((float) $payment->amount + (float) $payment->fee, 2);
            if ((float) $customerWallet->balance < $total) {
                return response()->json(['success' => false, 'message' => 'Insufficient balance.'], 422);
            }

            DB::table('wallets')->where('id', $customerWallet->id)->decrement('balance', (string) $total);
            DB::table('wallets')->where('id', $merchantWallet->id)->increment('balance', (string) $payment->amount);

            $adminWallet = $this->walletService->adminWallet();
            if ($adminWallet && (int) $adminWallet->id !== (int) $customerWallet->id && (int) $adminWallet->id !== (int) $merchantWallet->id && (float) $payment->fee > 0) {
                DB::table('wallets')->where('id', $adminWallet->id)->increment('balance', (string) $payment->fee);
            }

            $txId = DB::table('transactions')->insertGetId([
                'transaction_number' => Str::upper('TX'.Str::random(12)),
                'sender_wallet_id' => $customerWallet->id,
                'receiver_wallet_id' => $merchantWallet->id,
                'transaction_type' => 'merchant_payment',
                'amount' => $payment->amount,
                'fee' => $payment->fee,
                'qr_id' => null,
                'agent_id' => null,
                'status' => 'completed',
                'pin_verified' => true,
                'description' => $payment->description ?? 'Merchant payment',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $payment->update(['status' => 'completed', 'transaction_id' => $txId]);

            $this->otpService->markUsed($payment->customer_user_id, 'merchant_payment');

            return Transaction::with(['senderWallet.user', 'receiverWallet.user'])->find($txId);
        });
    }

    protected function findCustomerByPhone(string $phone): ?User
    {
        $customerRoleId = DB::table('roles')->where('name', 'customer')->value('id');
        if (! $customerRoleId) {
            return null;
        }

        $normalizedPhone = $this->normalizePhone($phone);
        $candidatePhones = array_values(array_unique(array_filter([
            trim($phone),
            $normalizedPhone,
            preg_replace('/[^\d]/', '', $phone),
            preg_replace('/[^\d]/', '', $normalizedPhone),
        ], fn ($value) => $value !== '')));

        $user = User::where('role_id', $customerRoleId)->where(function ($query) use ($candidatePhones) {
            foreach ($candidatePhones as $candidatePhone) {
                $query->orWhere('phone_number', $candidatePhone);
            }
        })->first();

        return $user;
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\External\ConfirmPaymentRequest;
use App\Http\Requests\External\InitiatePaymentRequest;
use App\Models\CustomerProfile;
use App\Models\ExternalPayment;
use App\Models\User;
use App\Services\ExternalPaymentService;
use App\Services\OtpService;
use App\Services\TransferSettingsService;
use App\Traits\NormalizesPhoneNumber;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ExternalPaymentController extends Controller
{
    use NormalizesPhoneNumber;

    public function __construct(
        private readonly OtpService $otpService,
        private readonly TransferSettingsService $settingsService,
        private readonly ExternalPaymentService $paymentService,
    ) {}

    /**
     * Step 1 — the external system starts a payment for a customer.
     *
     * The customer is identified by phone number and the receiver must be an
     * agent. An OTP is sent to the customer's phone and a pending payment
     * intent is stored so the amount/agent cannot be changed at confirmation.
     */
    public function initiate(InitiatePaymentRequest $request): JsonResponse
    {
        $externalSystem = $request->attributes->get('external_system');
        $data = $request->validated();

        $customerPhone = $this->normalizePhone($data['customer_phone']);

        if (! $externalSystem->user_id) {
            return response()->json(['success' => false, 'message' => 'External system is not linked to an agent and cannot receive payments.'], 422);
        }

        $agent = User::find($externalSystem->user_id);
        if (! $agent) {
            return response()->json(['success' => false, 'message' => 'External system agent account not found.'], 422);
        }

        if ($this->resolveUserRole($agent->id) !== 'agent') {
            return response()->json(['success' => false, 'message' => 'External system is not linked to a valid agent.'], 422);
        }

        if ($agent->status !== 'active') {
            return response()->json(['success' => false, 'message' => 'Agent account is '.$agent->status.' and cannot receive payments.'], 403);
        }

        $customer = $this->findUserByPhone($customerPhone);
        if (! $customer) {
            return response()->json(['success' => false, 'message' => 'Customer account not found for the given phone number.'], 422);
        }

        if ($this->resolveUserRole($customer->id) !== 'customer') {
            return response()->json(['success' => false, 'message' => 'Sender must be a customer.'], 422);
        }

        if ($customer->status !== 'active') {
            return response()->json(['success' => false, 'message' => 'Customer account is '.$customer->status.' and cannot make payments.'], 403);
        }

        $customerWallet = DB::table('wallets')->where('user_id', $customer->id)->first();
        if (! $customerWallet) {
            return response()->json(['success' => false, 'message' => 'Customer has no wallet.'], 422);
        }

        if (($customerWallet->status ?? 'active') !== 'active') {
            return response()->json(['success' => false, 'message' => 'Customer wallet is inactive.'], 422);
        }

        $amount = (float) $data['amount'];
        $settings = $this->settingsService->get();
        $fee = round($amount * (float) $settings->customer_transfer_fee_percent / 100, 2);

        $customerProfile = CustomerProfile::where('user_id', $customer->id)->first();
        $isNrcVerified = $customerProfile && $customerProfile->kyc_status === 'verified';

        $limit = $settings->unverified_customer_transfer_limit;
        if (! $isNrcVerified && $limit !== null && $amount > (float) $limit) {
            return response()->json([
                'success' => false,
                'message' => 'The customer account is not NRC-verified yet. Payments are limited to '.number_format((float) $limit, 2).' MMK per transaction. Please verify the customer NRC to remove this limit.',
            ], 422);
        }

        // Reject up front (before creating any record or sending an OTP) when the
        // customer cannot cover the amount + fee, instead of failing at confirm.
        $total = round($amount + $fee, 2);
        if ((float) $customerWallet->balance < $total) {
            return response()->json([
                'success' => false,
                'message' => 'Insufficient balance. Please top up your wallet before making this payment.',
            ], 422);
        }

        $expiresAt = Carbon::now()->addMinutes(10);

        $payment = ExternalPayment::create([
            'reference' => 'PAY-'.Str::upper(Str::random(12)),
            'external_system_id' => $externalSystem->id,
            'customer_user_id' => $customer->id,
            'agent_user_id' => $agent->id,
            'amount' => $amount,
            'fee' => $fee,
            'order_reference' => $data['order_reference'] ?? null,
            'description' => $data['description'] ?? null,
            'redirect_url' => $data['redirect_url'] ?? null,
            'status' => 'pending',
            'expires_at' => $expiresAt,
        ]);

        $purpose = 'external_payment:'.$payment->id;
        $otp = $this->otpService->issue($customer->id, $customer->phone_number, $purpose);

        return response()->json([
            'success' => true,
            'message' => 'Payment initiated. Redirect the customer to the hosted payment page to enter their OTP and PIN.',
            'data' => [
                'payment_reference' => $payment->reference,
                'payment_url' => route('external-payments.pay', $payment->reference),
                'amount' => (float) $payment->amount,
                'fee' => (float) $payment->fee,
                'total' => round((float) $payment->amount + (float) $payment->fee, 2),
                'status' => $payment->status,
                'otp_code' => app()->environment('local', 'testing') ? $otp['otp_code'] : null,
                'expires_at' => $expiresAt->toISOString(),
            ],
        ], 201);
    }

    /**
     * Step 2 — the customer confirms the payment with the OTP and their PIN.
     * The amount and receiver were fixed when the payment was initiated.
     *
     * Kept for backwards compatibility with external systems that collect the
     * OTP/PIN themselves. New integrations should redirect the customer to the
     * hosted payment page (payment_url) instead.
     */
    public function confirm(ConfirmPaymentRequest $request): JsonResponse
    {
        $data = $request->validated();

        $payment = $this->paymentService->findByReference($data['payment_reference']);
        if (! $payment) {
            return response()->json(['success' => false, 'message' => 'Payment request not found.'], 404);
        }

        return $this->paymentService->complete($payment, $data['otp'], $data['pin']);
    }

    /**
     * External systems can poll the status of a payment (e.g. after the customer
     * returns from the hosted payment page) to reconcile their local records.
     */
    public function externalStatus(string $reference): JsonResponse
    {
        $payment = ExternalPayment::with('transaction')->where('reference', $reference)->first();
        if (! $payment) {
            return response()->json(['success' => false, 'message' => 'Payment not found.'], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'reference' => $payment->reference,
                'order_reference' => $payment->order_reference,
                'status' => $payment->status,
                'amount' => (float) $payment->amount,
                'fee' => (float) $payment->fee,
                'total' => round((float) $payment->amount + (float) $payment->fee, 2),
                'transaction_number' => $payment->transaction?->transaction_number,
                'completed_at' => $payment->completed_at?->toISOString(),
            ],
        ], 200);
    }

    /**
     * Admin listing of external payment requests.
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = min(100, max(1, (int) $request->query('per_page', 15)));
        $query = ExternalPayment::with(['customer', 'agent', 'externalSystem']);

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('reference', 'like', "%{$search}%")
                    ->orWhere('order_reference', 'like', "%{$search}%")
                    ->orWhereHas('customer', function ($uq) use ($search) {
                        $uq->where('phone_number', 'like', "%{$search}%")
                            ->orWhere('full_name', 'like', "%{$search}%");
                    })
                    ->orWhereHas('agent', function ($uq) use ($search) {
                        $uq->where('phone_number', 'like', "%{$search}%")
                            ->orWhere('full_name', 'like', "%{$search}%");
                    });
            });
        }

        $list = $query->orderByDesc('id')->paginate($perPage);

        return response()->json(['success' => true, 'data' => $list], 200);
    }

    public function show(int $id): JsonResponse
    {
        $payment = ExternalPayment::with(['customer', 'agent', 'externalSystem', 'transaction'])->find($id);
        if (! $payment) {
            return response()->json(['success' => false, 'message' => 'Payment request not found.'], 404);
        }

        return response()->json(['success' => true, 'data' => $payment], 200);
    }

    /**
     * Listing of external payments belonging to the authenticated user
     * (agents receive them, customers pay them).
     */
    public function myHistory(Request $request): JsonResponse
    {
        $user = $request->user();
        $roleName = optional($user->role)->name;
        $perPage = min(100, max(1, (int) $request->query('per_page', 50)));

        $query = ExternalPayment::with(['customer', 'externalSystem']);

        if ($roleName === 'agent') {
            $query->where('agent_user_id', $user->id);
        } elseif ($roleName === 'customer') {
            $query->where('customer_user_id', $user->id);
        } else {
            return response()->json(['success' => false, 'message' => 'Forbidden.'], 403);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('reference', 'like', "%{$search}%")
                    ->orWhere('order_reference', 'like', "%{$search}%")
                    ->orWhereHas('customer', function ($uq) use ($search) {
                        $uq->where('phone_number', 'like', "%{$search}%")
                            ->orWhere('full_name', 'like', "%{$search}%");
                    });
            });
        }

        $list = $query->orderByDesc('id')->paginate($perPage);

        return response()->json(['success' => true, 'data' => $list], 200);
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

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\CreatePinRequest;
use App\Http\Requests\Auth\ForgotPinRequest;
use App\Http\Requests\Auth\RequestOtpRequest;
use App\Http\Requests\Auth\VerifyOtpRequest;
use App\Http\Requests\Auth\VerifyPinRequest;
use App\Http\Resources\UserResource;
use App\Models\CustomerProfile;
use App\Models\User;
use App\Models\Wallet;
use App\Services\QrCodeService;
use App\Traits\NormalizesPhoneNumber;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    use NormalizesPhoneNumber;
    public function __construct(private readonly QrCodeService $qrCodeService)
    {
    }

    public function requestOtp(RequestOtpRequest $request): JsonResponse
    {
        $data = $request->validated();

        // Normalize phone to 09 format before any storage or lookup
        $data['phone_number'] = $this->normalizePhone($data['phone_number']);

        $requestedRoleId = $data['role_id'] ?? null;
        // If role_id not provided by client, treat the request as coming from customer app
        if (! empty($requestedRoleId)) {
            $requestedRoleName = DB::table('roles')->where('id', $requestedRoleId)->value('name');
        } else {
            $requestedRoleName = 'customer';
        }

        if ($requestedRoleName && strtolower($requestedRoleName) === 'admin') {
            $providedPhone = $this->formatPhoneNumber($data['phone_number']);
            $adminPhone = $this->formatPhoneNumber(env('AUTH_ADMIN_PHONE', ''));
            if ($adminPhone === '' || $providedPhone !== $adminPhone) {
                return response()->json([
                    'success' => false,
                    'message' => 'Only the configured admin phone number can request OTP for admin role.',
                ], 422);
            }
        }

        $user = $this->findUserByPhoneNumber($data['phone_number']);

        if (in_array($requestedRoleName, ['agent_manager', 'agent'], true)) {
            if (! $user) {
                $suggestion = $requestedRoleName === 'agent_manager'
                    ? 'Please ask an admin to create the account first.'
                    : 'Please ask an agent manager to create the account first.';

                return response()->json([
                    'success' => false,
                    'message' => ucfirst($requestedRoleName) . ' account not found. ' . $suggestion,
                ], 422);
            }

            if ($user->role_id !== $requestedRoleId) {
                return response()->json([
                    'success' => false,
                    'message' => 'This phone number is not registered as an ' . str_replace('_', ' ', $requestedRoleName) . '.',
                ], 422);
            }

            if (! in_array($user->status, ['active', 'pending'], true)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Your ' . str_replace('_', ' ', $requestedRoleName) . ' account is currently ' . $user->status . '. Please contact your administrator.',
                ], 403);
            }
        }

        // Prevent using an admin/agent phone number to register as a customer
        if ($user) {
            // Resolve role IDs for admin/agent roles (robust against naming/casing differences)
            $forbiddenRoles = DB::table('roles')->whereIn('name', ['admin', 'agent_manager', 'agent'])->pluck('id')->all();

            $isRequestingCustomerRole = strtolower((string) $requestedRoleName) === 'customer';
            $userRoleId = $user->role_id ?? null;

            if ($isRequestingCustomerRole && $userRoleId && in_array($userRoleId, $forbiddenRoles, true)) {
                $currentRoleName = DB::table('roles')->where('id', $userRoleId)->value('name');
                return response()->json([
                    'success' => false,
                    'message' => 'This phone number is already registered as ' . ($currentRoleName ?? 'another role') . '. Please use the appropriate login flow or contact support.',
                ], 422);
            }
        }

        if (! $user) {
            $userAttributes = [
                'phone_number' => $data['phone_number'],
                'status' => 'active',
                'role_id' => $data['role_id'] ?? null,
            ];

            if (! empty($data['full_name'])) {
                $userAttributes['full_name'] = $data['full_name'];
            }

            if (! empty($data['nrc_number'])) {
                $userAttributes['nrc_number'] = $data['nrc_number'];
            }

            $user = User::create($userAttributes);
        } else {
            if (array_key_exists('role_id', $data) && $data['role_id'] !== null && $data['role_id'] != $user->role_id) {
                $user->role_id = $data['role_id'];
                $user->save();
            }
        }

        // Auto-create CustomerProfile if role is customer
        $resolvedRoleName = ! empty($user->role_id) ? DB::table('roles')->where('id', $user->role_id)->value('name') : 'customer';
        if (strtolower((string) $resolvedRoleName) === 'customer') {
            CustomerProfile::firstOrCreate(
                ['user_id' => $user->id],
                ['kyc_status' => 'pending']
            );
        }
        
        // Auto-create wallet if user doesn't have one yet
        if (!Wallet::where('user_id', $user->id)->exists()) {
            do {
                $walletNumber = 'WAL-' . strtoupper(\Illuminate\Support\Str::random(8));
            } while (Wallet::where('wallet_number', $walletNumber)->exists());
            
            Wallet::create([
                'user_id' => $user->id,
                'wallet_number' => $walletNumber,
                'balance' => 0,
                'status' => 'active',
            ]);
        }

        $otpCode = (string) random_int(100000, 999999);
        $expiresAt = Carbon::now()->addMinutes(5);

        DB::table('otp_verifications')->insert([
            'user_id' => $user->id,
            'phone_number' => $data['phone_number'],
            'otp_code' => $otpCode,
            'purpose' => 'login',
            'status' => 'pending',
            'attempt_count' => 0,
            'expires_at' => $expiresAt,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $smsResult = $this->sendOtpCode($data['phone_number'], $otpCode);
        $message = $smsResult['success']
            ? 'OTP sent successfully.'
            : 'OTP generated successfully. ' . $smsResult['message'];

        $roleName = null;
        if (! empty($user->role_id)) {
            $roleName = DB::table('roles')->where('id', $user->role_id)->value('name');
        }

        return response()->json([
            'success' => $smsResult['success'],
            'message' => $message,
            'data' => [
                'phone_number' => $data['phone_number'],
                'otp_code' => app()->environment('local', 'testing') ? $otpCode : null,
                'expires_at' => $expiresAt->toISOString(),
                'sms_sent' => $smsResult['success'],
                'sms_delivery_message' => $smsResult['message'],
                'role_id' => $user->role_id,
                'role' => $roleName,
            ],
        ], 200);
    }

    public function verifyOtp(VerifyOtpRequest $request): JsonResponse
    {
        $data = $request->validated();

        $user = $this->findUserByPhoneNumber($data['phone_number']);

        if (! $user) {
            throw ValidationException::withMessages([
                'phone_number' => ['User not found.'],
            ]);
        }

        $otp = DB::table('otp_verifications')
            ->where('user_id', $user->id)
            ->where('otp_code', $data['otp_code'])
            ->where('status', 'pending')
            ->latest('created_at')
            ->first();

        if (! $otp) {
            // Record the failed attempt on the user's latest pending OTP and
            // invalidate it after too many attempts (brute-force protection).
            $latest = DB::table('otp_verifications')
                ->where('user_id', $user->id)
                ->where('status', 'pending')
                ->latest('created_at')
                ->first();

            if ($latest) {
                $attempts = (int) $latest->attempt_count + 1;
                $update = ['attempt_count' => $attempts, 'updated_at' => now()];
                if ($attempts >= 5) {
                    $update['status'] = 'expired';
                }
                DB::table('otp_verifications')->where('id', $latest->id)->update($update);
            }

            return response()->json([
                'success' => false,
                'message' => 'Invalid OTP.',
            ], 422);
        }

        if ((int) $otp->attempt_count >= 5) {
            DB::table('otp_verifications')->where('id', $otp->id)->update([
                'status' => 'expired',
                'updated_at' => now(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Too many attempts. Please request a new OTP.',
            ], 422);
        }

        if (Carbon::parse($otp->expires_at)->isPast()) {
            return response()->json([
                'success' => false,
                'message' => 'OTP has expired.',
            ], 422);
        }

        // Update OTP status to verified and extend expiry for the PIN creation flow
        DB::table('otp_verifications')->where('id', $otp->id)->update([
            'status' => 'verified',
            'verified_at' => now(),
            'expires_at' => Carbon::now()->addMinutes(30),
            'updated_at' => now(),
        ]);

        $user->update(['is_phone_verified' => true]);

        $hasPin = DB::table('pins')->where('user_id', $user->id)->exists();
        $nextStep = ($user->is_pin_created && $hasPin) ? 'verify_pin' : 'create_pin';

        $roleName = null;
        if (! empty($user->role_id)) {
            $roleName = DB::table('roles')->where('id', $user->role_id)->value('name');
        }

        $requiresProfile = false;
        if ($nextStep === 'create_pin' && strtolower((string) $roleName) === 'customer') {
            $requiresProfile = empty($user->full_name) || empty($user->nrc_number);
        }

        return response()->json([
            'success' => true,
            'message' => 'OTP verified successfully.',
            'data' => [
                'user_id' => $user->id,
                'phone_number' => $user->phone_number,
                'next_step' => $nextStep,
                'requires_profile' => $requiresProfile,
                'otp_verified_at' => now()->toISOString(),
                'expires_at' => Carbon::now()->addMinutes(30)->toISOString(),
            ],
        ], 200);
    }

    public function createPin(CreatePinRequest $request): JsonResponse
    {
        $data = $request->validated();

        return DB::transaction(function () use ($data): JsonResponse {
            $user = User::findOrFail($data['user_id']);

            // 🔒 SECURITY: Verify that OTP was recently verified (within last 30 minutes)
            $validOtp = DB::table('otp_verifications')
                ->where('user_id', $user->id)
                ->where('status', 'verified')
                ->where('expires_at', '>', Carbon::now())
                ->latest('created_at')
                ->first();

            if (! $validOtp) {
                return response()->json([
                    'success' => false,
                    'message' => 'OTP verification required. Please verify your OTP first.',
                ], 401);
            }

            DB::table('pins')->updateOrInsert(
                ['user_id' => $user->id],
                [
                    'pin_hash' => Hash::make($data['pin']),
                    'failed_attempts' => 0,
                    'is_locked' => false,
                    'locked_until' => null,
                    'last_changed_at' => now(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );

            $roleName = null;
            if (! empty($user->role_id)) {
                $roleName = DB::table('roles')->where('id', $user->role_id)->value('name');
            }

            $userData = [
                'is_pin_created' => true,
                'status' => 'active',
            ];

            if (strtolower((string) $roleName) === 'customer') {
                $userData['full_name'] = $data['full_name'] ?? $user->full_name;
                $userData['nrc_number'] = $data['nrc_number'] ?? $user->nrc_number;
            }

            $user->update($userData);

            if (strtolower((string) $roleName) === 'customer') {
                CustomerProfile::firstOrCreate(
                    ['user_id' => $user->id],
                    ['kyc_status' => 'pending']
                );
            }

            // Auto-create wallet for the user when PIN is created
            if (! Wallet::where('user_id', $user->id)->exists()) {
                $initialBalance = 0;
                if (strtolower((string) $roleName) === 'admin') {
                    $initialBalance = (float) env('ADMIN_INITIAL_WALLET_BALANCE', 0);
                }

                $walletNumber = 'WAL-' . strtoupper(bin2hex(random_bytes(4)));

                Wallet::create([
                    'user_id' => $user->id,
                    'wallet_number' => $walletNumber,
                    'balance' => $initialBalance,
                    'status' => 'active',
                ]);
            }

            $this->qrCodeService->ensureForUser($user->fresh());

            // Invalidate the OTP after PIN creation (prevent reuse)
            DB::table('otp_verifications')
                ->where('user_id', $user->id)
                ->where('status', 'verified')
                ->update([
                    'status' => 'used',
                    'updated_at' => now(),
                ]);

            return response()->json([
                'success' => true,
                'message' => 'PIN created successfully.',
                'data' => [
                    'user_id' => $user->id,
                    'next_step' => 'verify_pin',
                ],
            ], 201);
        });
    }

    public function verifyPin(VerifyPinRequest $request): JsonResponse
    {
        $data = $request->validated();

        $user = User::findOrFail($data['user_id']);
        $pinRecord = DB::table('pins')->where('user_id', $user->id)->first();

        if (! $pinRecord) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid PIN.',
            ], 401);
        }

        // Enforce PIN lockout after repeated failures
        if ($pinRecord->is_locked) {
            if ($pinRecord->locked_until && Carbon::parse($pinRecord->locked_until)->isFuture()) {
                return response()->json([
                    'success' => false,
                    'message' => 'PIN is temporarily locked due to too many failed attempts. Please try again later.',
                    'locked_until' => $pinRecord->locked_until,
                ], 423);
            }

            // Lock expired - reset the lockout state
            DB::table('pins')->where('user_id', $user->id)->update([
                'failed_attempts' => 0,
                'is_locked' => false,
                'locked_until' => null,
                'updated_at' => now(),
            ]);
            $pinRecord = DB::table('pins')->where('user_id', $user->id)->first();
        }

        if (! Hash::check($data['pin'], $pinRecord->pin_hash)) {
            $this->registerPinFailure($user->id, (int) $pinRecord->failed_attempts);

            return response()->json([
                'success' => false,
                'message' => 'Invalid PIN.',
            ], 401);
        }

        // Reset failure counters on success
        DB::table('pins')->where('user_id', $user->id)->update([
            'failed_attempts' => 0,
            'is_locked' => false,
            'locked_until' => null,
            'updated_at' => now(),
        ]);

        // Check if OTP was verified recently (for first-time PIN verification)
        // For existing users, they can login with PIN without OTP
        $hasExistingPin = DB::table('pins')->where('user_id', $user->id)->exists();
        
        if ($user->is_pin_created && $hasExistingPin) {
            // User already has PIN - normal login flow
            // No OTP required
        } else {
            // New user or first-time PIN verification - require OTP
            $validOtp = DB::table('otp_verifications')
                ->where('user_id', $user->id)
                ->where('status', 'verified')
                ->where('expires_at', '>', Carbon::now())
                ->latest('created_at')
                ->first();

            if (! $validOtp) {
                return response()->json([
                    'success' => false,
                    'message' => 'OTP verification required. Please verify your OTP first.',
                ], 401);
            }
        }

        if ($user->status === 'pending') {
            $user->update(['status' => 'active']);
        }

        $token = $user->createToken('auth-token')->plainTextToken;



        $roleName = null;
        if (! empty($user->role_id)) {
            $roleName = DB::table('roles')->where('id', $user->role_id)->value('name');
        }

        if (strtolower((string) $roleName) === 'customer') {
            CustomerProfile::firstOrCreate(
                ['user_id' => $user->id],
                ['kyc_status' => 'pending']
            );
        }

        $user->load('images');

        // Ensure wallet exists for the user (safety net)
        if (! Wallet::where('user_id', $user->id)->exists()) {
            $initialBalance = 0;
            if (strtolower((string) $roleName) === 'admin') {
                $initialBalance = (float) env('ADMIN_INITIAL_WALLET_BALANCE', 0);
            }

            $walletNumber = 'WAL-' . strtoupper(bin2hex(random_bytes(4)));

            Wallet::create([
                'user_id' => $user->id,
                'wallet_number' => $walletNumber,
                'balance' => $initialBalance,
                'status' => 'active',
            ]);
        }

        $this->qrCodeService->ensureForUser($user->fresh());

        return response()->json([
            'success' => true,
            'message' => 'PIN verified successfully.',
            'data' => array_merge(
                (new UserResource($user))->resolve(),
                [
                    'role'         => $roleName,
                    'access_token' => $token,
                    'token_type'   => 'Bearer',
                ]
            ),
        ], 200);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()?->currentAccessToken()?->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully.',
        ], 200);
    }

    public function resendOtp(RequestOtpRequest $request): JsonResponse
    {
        return $this->requestOtp($request);
    }

    public function forgotPin(RequestOtpRequest $request): JsonResponse
    {
        return $this->requestOtp($request);
    }

    public function resetPin(ForgotPinRequest $request): JsonResponse
    {
        $data = $request->validated();

        $user = $this->findUserByPhoneNumber($data['phone_number']);

        if (! $user) {
            return response()->json([
                'success' => false,
                'message' => 'User not found.',
            ], 422);
        }

        $otp = DB::table('otp_verifications')
            ->where('user_id', $user->id)
            ->where('otp_code', $data['otp_code'])
            ->where('status', 'verified')
            ->latest('created_at')
            ->first();

        if (! $otp) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid OTP.',
            ], 422);
        }

        // Check if OTP is expired (for reset pin)
        if (Carbon::parse($otp->expires_at)->isPast()) {
            return response()->json([
                'success' => false,
                'message' => 'OTP has expired. Please request a new OTP.',
            ], 422);
        }

        DB::table('pins')->updateOrInsert(
            ['user_id' => $user->id],
            [
                'pin_hash' => Hash::make($data['new_pin']),
                'failed_attempts' => 0,
                'is_locked' => false,
                'locked_until' => null,
                'last_changed_at' => now(),
                'updated_at' => now(),
            ]
        );

        // Invalidate the OTP after PIN reset
        DB::table('otp_verifications')
            ->where('user_id', $user->id)
            ->where('status', 'verified')
            ->update([
                'status' => 'used',
                'updated_at' => now(),
            ]);

        return response()->json([
            'success' => true,
            'message' => 'PIN reset successfully.',
        ], 200);
    }

    protected function registerPinFailure(int $userId, int $currentFailedAttempts): void
    {
        $maxAttempts = 5;
        $failedAttempts = $currentFailedAttempts + 1;

        $update = [
            'failed_attempts' => $failedAttempts,
            'updated_at' => now(),
        ];

        if ($failedAttempts >= $maxAttempts) {
            $update['is_locked'] = true;
            $update['locked_until'] = Carbon::now()->addMinutes(15);
        }

        DB::table('pins')->where('user_id', $userId)->update($update);
    }

    protected function sendOtpCode(string $phoneNumber, string $otpCode): array
    {
        $config = config('services.infinireach');
        $isTestMode = filter_var($config['test_mode'] ?? env('INFINIREACH_TEST_MODE', false), FILTER_VALIDATE_BOOLEAN);

        if (empty($config['api_key'])) {
            Log::info('OTP code', [
                'phone_number' => $phoneNumber,
                'otp_code' => $otpCode,
            ]);

            return [
                'success' => false,
                'message' => 'SMS delivery is disabled because no provider API key is configured.',
            ];
        }

        if ($isTestMode) {
            Log::info('OTP test mode enabled; SMS delivery skipped', [
                'phone_number' => $phoneNumber,
                'otp_code' => $otpCode,
            ]);

            return [
                'success' => false,
                'message' => 'SMS delivery is skipped in test mode.',
            ];
        }

        $formattedPhone = $this->formatPhoneForSms($phoneNumber);
        $baseUrl = rtrim($config['base_url'] ?? '', '/');
        $baseUrl = preg_replace('#/messages/?$#', '', $baseUrl) ?: $config['base_url'];

        try {
            $response = Http::timeout(60)
                ->retry(2, 200)
                ->withHeaders([
                    'Content-Type' => 'application/json',
                    'X-API-Key' => $config['api_key'],
                ])->post($baseUrl . '/messages', [
                    'channel' => 'sms',
                    'to' => $formattedPhone,
                    'from' => $config['sender_number'],
                    'message' => "Your OTP code is {$otpCode}",
                ]);

            if ($response->successful()) {
                Log::info('OTP sent successfully via Infinireach', [
                    'phone_number' => $formattedPhone,
                    'status' => $response->status(),
                ]);

                return [
                    'success' => true,
                    'message' => 'SMS delivery completed successfully.',
                ];
            }

            Log::warning('Failed to send OTP via Infinireach', [
                'phone_number' => $formattedPhone,
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
        } catch (\Throwable $e) {
            Log::warning('Failed to send OTP via Infinireach', [
                'phone_number' => $formattedPhone,
                'error' => $e->getMessage(),
            ]);
        }

        return [
            'success' => false,
            'message' => 'SMS delivery could not be completed. Please try again later.',
        ];
    }

    protected function formatPhoneNumber(string $phoneNumber): string
    {
        return $this->normalizePhone($phoneNumber);
    }

    protected function formatPhoneForSms(string $phoneNumber): string
    {
        return $this->phoneToInternational($phoneNumber);
    }

    protected function findUserByPhoneNumber(string $phoneNumber): ?User
    {
        $localPhone = $this->normalizePhone($phoneNumber);
        $intlPhone  = $this->phoneToInternational($localPhone);
        $rawPhone   = ltrim($intlPhone, '+');

        return User::where('phone_number', $localPhone)
            ->orWhere('phone_number', $intlPhone)
            ->orWhere('phone_number', $rawPhone)
            ->orWhere('phone_number', $phoneNumber)
            ->first();
    }
}
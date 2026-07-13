<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\CreatePinRequest;
use App\Http\Requests\Auth\ForgotPinRequest;
use App\Http\Requests\Auth\RequestOtpRequest;
use App\Http\Requests\Auth\VerifyOtpRequest;
use App\Http\Requests\Auth\VerifyPinRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Models\Wallet;
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
    public function requestOtp(RequestOtpRequest $request): JsonResponse
    {
        $data = $request->validated();

        $requestedRoleId = $data['role_id'] ?? null;
        $requestedRoleName = null;
        if (! empty($requestedRoleId)) {
            $requestedRoleName = DB::table('roles')->where('id', $requestedRoleId)->value('name');
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

        $user = User::where('phone_number', $data['phone_number'])->first();

        if (! $user) {
            $user = User::create([
                'phone_number' => $data['phone_number'],
                'status' => 'active',
                'role_id' => $data['role_id'] ?? null,
            ]);
        } else {
            if (array_key_exists('role_id', $data) && $data['role_id'] !== null && $data['role_id'] != $user->role_id) {
                $user->role_id = $data['role_id'];
                $user->save();
            }
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
                'otp_code' => $otpCode,
                'expires_at' => $expiresAt->toISOString(),
                'sms_sent' => $smsResult['success'],
                'sms_delivery_message' => $smsResult['message'],
                'role_id' => $user->role_id,
                'role' => $roleName,
            ],
        ], $smsResult['success'] ? 200 : 200);
    }

    public function verifyOtp(VerifyOtpRequest $request): JsonResponse
    {
        $data = $request->validated();

        $user = User::where('phone_number', $data['phone_number'])->first();

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
            return response()->json([
                'success' => false,
                'message' => 'Invalid OTP.',
            ], 422);
        }

        if (Carbon::parse($otp->expires_at)->isPast()) {
            return response()->json([
                'success' => false,
                'message' => 'OTP has expired.',
            ], 422);
        }

        DB::table('otp_verifications')->where('id', $otp->id)->update([
            'status' => 'verified',
            'verified_at' => now(),
            'updated_at' => now(),
        ]);

        $user->update(['is_phone_verified' => true]);

        $nextStep = $user->is_pin_created ? 'verify_pin' : 'create_pin';

        return response()->json([
            'success' => true,
            'message' => 'OTP verified successfully.',
            'data' => [
                'user_id' => $user->id,
                'phone_number' => $user->phone_number,
                'next_step' => $nextStep,
            ],
        ], 200);
    }

    public function createPin(CreatePinRequest $request): JsonResponse
    {
        $data = $request->validated();

        $user = User::findOrFail($data['user_id']);

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
        ];

        if (strtolower((string) $roleName) === 'customer') {
            $userData['full_name'] = $data['full_name'] ?? $user->full_name;
            $userData['nrc_number'] = $data['nrc_number'] ?? $user->nrc_number;
        }

        $user->update($userData);

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
                'currency' => env('DEFAULT_CURRENCY', 'MMK'),
                'status' => 'active',
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'PIN created successfully.',
            'data' => [
                'user_id' => $user->id,
                'next_step' => 'verify_pin',
            ],
        ], 201);
    }

    public function verifyPin(VerifyPinRequest $request): JsonResponse
    {
        $data = $request->validated();

        $user = User::findOrFail($data['user_id']);
        $pinRecord = DB::table('pins')->where('user_id', $user->id)->first();

        if (! $pinRecord || ! Hash::check($data['pin'], $pinRecord->pin_hash)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid PIN.',
            ], 401);
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        DB::table('user_devices')->insert([
            'user_id' => $user->id,
            'device_id' => $data['device_id'] ?? null,
            'device_name' => $data['device_name'] ?? null,
            'ip_address' => $request->ip(),
            'login_at' => now(),
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $roleName = null;
        if (! empty($user->role_id)) {
            $roleName = DB::table('roles')->where('id', $user->role_id)->value('name');
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
                'currency' => env('DEFAULT_CURRENCY', 'MMK'),
                'status' => 'active',
            ]);
        }

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

        $formattedPhone = $this->formatPhoneNumber($phoneNumber);
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
        $phoneNumber = preg_replace('/[\s-]/', '', $phoneNumber);

        if (str_starts_with($phoneNumber, '09')) {
            return '+959' . substr($phoneNumber, 2);
        }

        if (str_starts_with($phoneNumber, '959')) {
            return '+' . $phoneNumber;
        }

        if (str_starts_with($phoneNumber, '+959')) {
            return $phoneNumber;
        }

        return $phoneNumber;
    }

    public function resetPin(ForgotPinRequest $request): JsonResponse
    {
        $data = $request->validated();

        $user = User::where('phone_number', $data['phone_number'])->first();

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

        return response()->json([
            'success' => true,
            'message' => 'PIN reset successfully.',
        ], 200);
    }
}

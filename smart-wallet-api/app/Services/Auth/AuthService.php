<?php

namespace App\Services\Auth;

use App\Models\CustomerProfile;
use App\Models\Role;
use App\Models\User;
use App\Models\UserDevice;
use App\Models\Wallet;
use App\Repositories\UserRepository;
use App\Services\Sms\InfinireachSmsService;
use Illuminate\Support\Str;

class AuthService
{
    public function __construct(
        protected UserRepository $userRepository,
        protected OtpService $otpService,
        protected PinService $pinService,
        protected InfinireachSmsService $smsService
    ) {}

    /**
     * Handle OTP request — determine user state and send OTP accordingly.
     *
     * @return array{success: bool, message: string, data: array}
     */
    public function requestOtp(string $phoneNumber): array
    {
        $formattedPhone = $this->smsService->formatPhoneNumber($phoneNumber);
        $user = $this->userRepository->findByPhone($formattedPhone);

        if (!$user) {
            // Case 1: New user — register flow
            $result = $this->otpService->generateAndSend($formattedPhone, 'register');

            return [
                'success' => true,
                'message' => 'OTP sent successfully.',
                'data' => [
                    'phone_number' => $formattedPhone,
                    'purpose' => 'register',
                    'is_new_user' => true,
                    'expires_in' => 300,
                ],
            ];
        }

        if (!$user->is_pin_created) {
            // Case 2: Existing user, OTP verified but PIN not created
            $result = $this->otpService->generateAndSend($formattedPhone, 'register', $user->id);

            return [
                'success' => true,
                'message' => 'OTP sent successfully. Please complete your registration.',
                'data' => [
                    'phone_number' => $formattedPhone,
                    'purpose' => 'register',
                    'is_new_user' => false,
                    'requires_pin_creation' => true,
                    'expires_in' => 300,
                ],
            ];
        }

        // Case 3: Existing user with PIN — login flow
        if ($user->status === 'blocked' || $user->status === 'suspended') {
            return [
                'success' => false,
                'message' => "Your account is {$user->status}. Please contact support.",
                'data' => [],
            ];
        }

        $result = $this->otpService->generateAndSend($formattedPhone, 'login', $user->id);

        return [
            'success' => true,
            'message' => 'OTP sent successfully.',
            'data' => [
                'phone_number' => $formattedPhone,
                'purpose' => 'login',
                'is_new_user' => false,
                'expires_in' => 300,
            ],
        ];
    }

    /**
     * Verify OTP and handle user creation for new users.
     *
     * @return array{success: bool, message: string, data: array}
     */
    public function verifyOtp(string $phoneNumber, string $otpCode): array
    {
        $formattedPhone = $this->smsService->formatPhoneNumber($phoneNumber);

        // Try to find the OTP — check both register and login purposes
        $user = $this->userRepository->findByPhone($formattedPhone);

        $purpose = 'register';
        if ($user && $user->is_pin_created) {
            $purpose = 'login';
        }

        $result = $this->otpService->verify($formattedPhone, $otpCode, $purpose);

        if (!$result['success']) {
            return [
                'success' => false,
                'message' => $result['message'],
                'data' => [],
            ];
        }

        // If new user — create user record
        if (!$user) {
            $customerRole = Role::where('name', 'customer')->first();

            $user = $this->userRepository->create([
                'phone_number' => $formattedPhone,
                'role_id' => $customerRole->id,
                'status' => 'pending',
                'is_phone_verified' => true,
            ]);

            return [
                'success' => true,
                'message' => 'OTP verified. Please create your PIN to complete registration.',
                'data' => [
                    'user_id' => $user->id,
                    'phone_number' => $formattedPhone,
                    'requires_pin_creation' => true,
                    'requires_pin_verification' => false,
                ],
            ];
        }

        // Existing user, phone not yet verified
        if (!$user->is_phone_verified) {
            $this->userRepository->update($user, ['is_phone_verified' => true]);
        }

        // Existing user, PIN not created yet
        if (!$user->is_pin_created) {
            return [
                'success' => true,
                'message' => 'OTP verified. Please create your PIN to complete registration.',
                'data' => [
                    'user_id' => $user->id,
                    'phone_number' => $formattedPhone,
                    'requires_pin_creation' => true,
                    'requires_pin_verification' => false,
                ],
            ];
        }

        // Existing user with PIN — require PIN verification next
        return [
            'success' => true,
            'message' => 'OTP verified. Please enter your PIN to complete login.',
            'data' => [
                'user_id' => $user->id,
                'phone_number' => $formattedPhone,
                'requires_pin_creation' => false,
                'requires_pin_verification' => true,
            ],
        ];
    }

    /**
     * Create PIN for a new user (completes registration).
     *
     * @return array{success: bool, message: string, data: array}
     */
    public function createPin(int $userId, string $pin, ?string $fullName = null, ?string $nrcNumber = null): array
    {
        $user = $this->userRepository->findById($userId);

        if (!$user) {
            return [
                'success' => false,
                'message' => 'User not found.',
                'data' => [],
            ];
        }

        if (!$user->is_phone_verified) {
            return [
                'success' => false,
                'message' => 'Phone number not verified. Please verify OTP first.',
                'data' => [],
            ];
        }

        if ($user->is_pin_created) {
            return [
                'success' => false,
                'message' => 'PIN already created. Use forgot-pin to reset.',
                'data' => [],
            ];
        }

        if ($fullName !== null) {
            $user->full_name = $fullName;
        }

        if ($nrcNumber !== null) {
            $user->nrc_number = $nrcNumber;
        }

        // Create the PIN
        $this->pinService->createPin($user, $pin);

        // Update user status
        $this->userRepository->update($user, [
            'full_name' => $fullName,
            'nrc_number' => $nrcNumber,
            'is_pin_created' => true,
            'status' => 'active',
            'last_login_at' => now(),
        ]);

        // Create wallet
        $wallet = $this->createWalletForUser($user);

        // Create customer profile
        $this->createCustomerProfile($user);

        // Issue Sanctum token
        $token = $user->createToken('auth-token')->plainTextToken;

        return [
            'success' => true,
            'message' => 'Registration completed successfully.',
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'phone_number' => $user->phone_number,
                    'full_name' => $user->full_name,
                    'status' => $user->status,
                ],
                'wallet' => [
                    'wallet_number' => $wallet->wallet_number,
                    'balance' => $wallet->balance,
                    'currency' => $wallet->currency,
                ],
                'token' => $token,
            ],
        ];
    }

    /**
     * Verify PIN for login (after OTP verification).
     *
     * @return array{success: bool, message: string, data: array}
     */
    public function verifyPin(int $userId, string $pin, ?array $deviceInfo = null): array
    {
        $user = $this->userRepository->findById($userId, ['wallet', 'role']);

        if (!$user) {
            return [
                'success' => false,
                'message' => 'User not found.',
                'data' => [],
            ];
        }

        if ($user->status === 'blocked' || $user->status === 'suspended') {
            return [
                'success' => false,
                'message' => "Your account is {$user->status}. Please contact support.",
                'data' => [],
            ];
        }

        $result = $this->pinService->verifyPin($user, $pin);

        if (!$result['success']) {
            return [
                'success' => false,
                'message' => $result['message'],
                'data' => [],
            ];
        }

        // Update last login
        $this->userRepository->update($user, ['last_login_at' => now()]);

        // Track device
        if ($deviceInfo) {
            $this->trackDevice($user, $deviceInfo);
        }

        // Issue Sanctum token
        $token = $user->createToken('auth-token')->plainTextToken;

        return [
            'success' => true,
            'message' => 'Login successful.',
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'phone_number' => $user->phone_number,
                    'full_name' => $user->full_name,
                    'role' => $user->role->name,
                    'status' => $user->status,
                ],
                'wallet' => $user->wallet ? [
                    'wallet_number' => $user->wallet->wallet_number,
                    'balance' => $user->wallet->balance,
                    'currency' => $user->wallet->currency,
                ] : null,
                'token' => $token,
            ],
        ];
    }

    /**
     * Logout — revoke current token.
     */
    public function logout(User $user): void
    {
        $user->currentAccessToken()->delete();

        // Deactivate device session
        UserDevice::where('user_id', $user->id)
            ->where('is_active', true)
            ->update([
                'is_active' => false,
                'logout_at' => now(),
            ]);
    }

    /**
     * Forgot PIN flow — send OTP for PIN reset.
     */
    public function forgotPin(string $phoneNumber): array
    {
        $formattedPhone = $this->smsService->formatPhoneNumber($phoneNumber);
        $user = $this->userRepository->findByPhone($formattedPhone);

        if (!$user) {
            return [
                'success' => false,
                'message' => 'No account found with this phone number.',
                'data' => [],
            ];
        }

        if (!$user->is_pin_created) {
            return [
                'success' => false,
                'message' => 'PIN has not been created yet.',
                'data' => [],
            ];
        }

        $this->otpService->generateAndSend($formattedPhone, 'reset_pin', $user->id);

        return [
            'success' => true,
            'message' => 'OTP sent for PIN reset.',
            'data' => [
                'phone_number' => $formattedPhone,
                'purpose' => 'reset_pin',
                'expires_in' => 300,
            ],
        ];
    }

    /**
     * Reset PIN after OTP verification.
     */
    public function resetPin(string $phoneNumber, string $otpCode, string $newPin): array
    {
        $formattedPhone = $this->smsService->formatPhoneNumber($phoneNumber);

        // Verify the reset_pin OTP
        $result = $this->otpService->verify($formattedPhone, $otpCode, 'reset_pin');

        if (!$result['success']) {
            return [
                'success' => false,
                'message' => $result['message'],
                'data' => [],
            ];
        }

        $user = $this->userRepository->findByPhone($formattedPhone);

        if (!$user) {
            return [
                'success' => false,
                'message' => 'User not found.',
                'data' => [],
            ];
        }

        $this->pinService->resetPin($user, $newPin);

        return [
            'success' => true,
            'message' => 'PIN reset successfully. Please login with your new PIN.',
            'data' => [],
        ];
    }

    /**
     * Create a wallet for the user.
     */
    protected function createWalletForUser(User $user): Wallet
    {
        return Wallet::create([
            'user_id' => $user->id,
            'wallet_number' => 'W' . str_pad((string) $user->id, 10, '0', STR_PAD_LEFT),
            'balance' => 0,
            'currency' => 'MMK',
            'status' => 'active',
        ]);
    }

    /**
     * Create a customer profile for the user.
     */
    protected function createCustomerProfile(User $user): CustomerProfile
    {
        return CustomerProfile::create([
            'user_id' => $user->id,
            'level' => 'basic',
            'kyc_status' => 'not_submitted',
            'referral_code' => strtoupper(Str::random(8)),
        ]);
    }

    /**
     * Track device login.
     */
    protected function trackDevice(User $user, array $deviceInfo): void
    {
        // Deactivate old device sessions
        UserDevice::where('user_id', $user->id)
            ->where('is_active', true)
            ->update(['is_active' => false]);

        UserDevice::create([
            'user_id' => $user->id,
            'device_id' => $deviceInfo['device_id'] ?? null,
            'device_name' => $deviceInfo['device_name'] ?? null,
            'ip_address' => $deviceInfo['ip_address'] ?? null,
            'login_at' => now(),
            'is_active' => true,
        ]);
    }
}

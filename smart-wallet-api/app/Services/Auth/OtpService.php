<?php

namespace App\Services\Auth;

use App\Jobs\SendOtpSmsJob;
use App\Repositories\OtpRepository;
use App\Services\Sms\InfinireachSmsService;
use Illuminate\Support\Facades\Hash;

class OtpService
{
    public function __construct(
        protected OtpRepository $otpRepository,
        protected InfinireachSmsService $smsService
    ) {}

    /**
     * Generate and send a new OTP.
     *
     * @return array{otp_code: string, otp_verification_id: int}
     */
    public function generateAndSend(string $phoneNumber, string $purpose, ?int $userId = null): array
    {
        // Expire any existing pending OTPs for this phone number
        $this->otpRepository->expireAllPending($phoneNumber);

        // Generate a random 6-digit OTP
        $otpCode = $this->generateOtpCode();

        // Format phone number to international format
        $formattedPhone = $this->smsService->formatPhoneNumber($phoneNumber);

        // Store hashed OTP
        $otp = $this->otpRepository->create([
            'user_id' => $userId,
            'phone_number' => $formattedPhone,
            'otp_code' => Hash::make($otpCode),
            'purpose' => $purpose,
            'status' => 'pending',
            'attempt_count' => 0,
            'expires_at' => now()->addMinutes(5),
        ]);

        // Dispatch SMS sending job (queued, never synchronous)
        SendOtpSmsJob::dispatch($formattedPhone, $otpCode, $otp->id);

        return [
            'otp_code' => $otpCode, // Only used internally — never returned in API response
            'otp_verification_id' => $otp->id,
        ];
    }

    /**
     * Verify an OTP code.
     *
     * @return array{success: bool, message: string, otp: ?\App\Models\OtpVerification}
     */
    public function verify(string $phoneNumber, string $otpCode, string $purpose): array
    {
        $formattedPhone = $this->smsService->formatPhoneNumber($phoneNumber);

        $otp = $this->otpRepository->findLatestPending($formattedPhone, $purpose);

        if (!$otp) {
            return [
                'success' => false,
                'message' => 'No pending OTP found. Please request a new one.',
                'otp' => null,
            ];
        }

        // Check expiry
        if ($otp->isExpired()) {
            $this->otpRepository->update($otp, ['status' => 'expired']);
            return [
                'success' => false,
                'message' => 'OTP has expired. Please request a new one.',
                'otp' => null,
            ];
        }

        // Check max attempts
        if ($otp->hasExceededAttempts(5)) {
            $this->otpRepository->update($otp, ['status' => 'failed']);
            return [
                'success' => false,
                'message' => 'Maximum OTP verification attempts exceeded. Please request a new OTP.',
                'otp' => null,
            ];
        }

        // Increment attempt count
        $this->otpRepository->incrementAttempt($otp);

        // Verify the OTP hash
        if (!Hash::check($otpCode, $otp->otp_code)) {
            // Check again if max attempts reached after increment
            if ($otp->fresh()->hasExceededAttempts(5)) {
                $this->otpRepository->update($otp, ['status' => 'failed']);
            }

            return [
                'success' => false,
                'message' => 'Invalid OTP code.',
                'otp' => null,
            ];
        }

        // Mark as verified
        $this->otpRepository->update($otp, [
            'status' => 'verified',
            'verified_at' => now(),
        ]);

        return [
            'success' => true,
            'message' => 'OTP verified successfully.',
            'otp' => $otp->fresh(),
        ];
    }

    /**
     * Generate a random 6-digit OTP code.
     */
    protected function generateOtpCode(): string
    {
        return str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
    }
}

<?php

namespace App\Services;

use App\Traits\NormalizesPhoneNumber;
use Carbon\Carbon;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class OtpService
{
    use NormalizesPhoneNumber;

    /**
     * Generate, store and (attempt to) send an OTP for a given purpose.
     *
     * @return array{success: bool, message: string, otp_code: string|null, expires_at: string}
     */
    public function issue(int $userId, string $phoneNumber, string $purpose): array
    {
        $otpCode = (string) random_int(100000, 999999);
        $expiresAt = Carbon::now()->addMinutes(5);

        DB::table('otp_verifications')->insert([
            'user_id' => $userId,
            'phone_number' => $phoneNumber,
            'otp_code' => $otpCode,
            'purpose' => $purpose,
            'status' => 'pending',
            'attempt_count' => 0,
            'expires_at' => $expiresAt,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $smsResult = $this->sendOtpCode($phoneNumber, $otpCode);
        $message = $smsResult['success']
            ? 'OTP sent successfully.'
            : 'OTP generated successfully. '.$smsResult['message'];

        return [
            'success' => $smsResult['success'],
            'message' => $message,
            'otp_code' => app()->environment('local', 'testing') ? $otpCode : null,
            'expires_at' => $expiresAt->toISOString(),
        ];
    }

    /**
     * Verify a pending OTP for the given user/purpose.
     * Returns true on success, or an error message string on failure.
     */
    public function verify(int $userId, string $otpCode, string $purpose): true|string
    {
        $otp = DB::table('otp_verifications')
            ->where('user_id', $userId)
            ->where('otp_code', $otpCode)
            ->where('purpose', $purpose)
            ->where('status', 'pending')
            ->latest('created_at')
            ->first();

        if (! $otp) {
            $latest = DB::table('otp_verifications')
                ->where('user_id', $userId)
                ->where('purpose', $purpose)
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

            return 'Invalid OTP.';
        }

        if ((int) $otp->attempt_count >= 5) {
            DB::table('otp_verifications')->where('id', $otp->id)->update([
                'status' => 'expired',
                'updated_at' => now(),
            ]);

            return 'Too many attempts. Please request a new OTP.';
        }

        if (Carbon::parse($otp->expires_at)->isPast()) {
            return 'OTP has expired.';
        }

        DB::table('otp_verifications')->where('id', $otp->id)->update([
            'status' => 'verified',
            'verified_at' => now(),
            'updated_at' => now(),
        ]);

        return true;
    }

    /**
     * Invalidate all verified OTPs for a user + purpose (single-use enforcement).
     */
    public function markUsed(int $userId, string $purpose): void
    {
        DB::table('otp_verifications')
            ->where('user_id', $userId)
            ->where('purpose', $purpose)
            ->where('status', 'verified')
            ->update([
                'status' => 'used',
                'updated_at' => now(),
            ]);
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

        $formattedPhone = $this->phoneToInternational($phoneNumber);
        $baseUrl = rtrim($config['base_url'] ?? '', '/');
        $baseUrl = preg_replace('#/messages/?$#', '', $baseUrl) ?: $config['base_url'];

        $response = null;
        try {
            $response = Http::timeout(60)
                ->retry(2, 200)
                ->withHeaders([
                    'Content-Type' => 'application/json',
                    'X-API-Key' => $config['api_key'],
                ])->post($baseUrl.'/messages', [
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

        $detail = null;
        if ($response instanceof Response && ! $response->successful()) {
            $detail = trim(implode(' ', array_filter([
                $response->json('code'),
                $response->json('message'),
            ])));
        }

        return [
            'success' => false,
            'message' => ($detail !== null && $detail !== '')
                ? 'SMS delivery failed: '.$detail
                : 'SMS delivery could not be completed. Please try again later.',
        ];
    }
}

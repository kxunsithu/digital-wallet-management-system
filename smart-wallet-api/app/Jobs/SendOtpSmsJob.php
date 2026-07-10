<?php

namespace App\Jobs;

use App\Models\OtpVerification;
use App\Services\Sms\InfinireachSmsService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SendOtpSmsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * The number of times the job may be attempted.
     */
    public int $tries = 3;

    /**
     * The maximum number of seconds the job can run.
     */
    public int $timeout = 30;

    public function __construct(
        protected string $phoneNumber,
        protected string $otpCode,
        protected ?int $otpVerificationId = null
    ) {}

    /**
     * Calculate the number of seconds to wait before retrying the job.
     * Exponential backoff: 10s, 30s, 60s
     */
    public function backoff(): array
    {
        return [10, 30, 60];
    }

    /**
     * Execute the job.
     */
    public function handle(InfinireachSmsService $smsService): void
    {
        $message = "Your Smart Wallet OTP code is: {$this->otpCode}. This code expires in 5 minutes. Do not share it with anyone.";

        $result = $smsService->send($this->phoneNumber, $message);

        // Update delivery status if we have an OTP verification ID
        if ($this->otpVerificationId) {
            $otp = OtpVerification::find($this->otpVerificationId);
            if ($otp) {
                $otp->update([
                    'delivery_status' => $result['success'] ? 'delivered' : 'failed',
                ]);
            }
        }

        if (!$result['success']) {
            Log::warning('OTP SMS delivery failed', [
                'phone' => $this->phoneNumber,
                'otp_verification_id' => $this->otpVerificationId,
                'attempt' => $this->attempts(),
            ]);

            // Re-throw to trigger retry
            throw new \RuntimeException('SMS delivery failed for ' . $this->phoneNumber);
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(?\Throwable $exception): void
    {
        Log::error('OTP SMS job failed permanently', [
            'phone' => $this->phoneNumber,
            'otp_verification_id' => $this->otpVerificationId,
            'error' => $exception?->getMessage(),
        ]);

        // Mark delivery as permanently failed
        if ($this->otpVerificationId) {
            $otp = OtpVerification::find($this->otpVerificationId);
            if ($otp) {
                $otp->update(['delivery_status' => 'permanently_failed']);
            }
        }
    }
}

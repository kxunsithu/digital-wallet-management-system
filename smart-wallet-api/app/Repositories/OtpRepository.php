<?php

namespace App\Repositories;

use App\Models\OtpVerification;

class OtpRepository
{
    /**
     * Create a new OTP verification record.
     */
    public function create(array $data): OtpVerification
    {
        return OtpVerification::create($data);
    }

    /**
     * Find the latest pending OTP for a phone number and purpose.
     */
    public function findLatestPending(string $phoneNumber, string $purpose): ?OtpVerification
    {
        return OtpVerification::where('phone_number', $phoneNumber)
            ->where('purpose', $purpose)
            ->where('status', 'pending')
            ->where('expires_at', '>', now())
            ->latest()
            ->first();
    }

    /**
     * Expire all pending OTPs for a phone number.
     */
    public function expireAllPending(string $phoneNumber): void
    {
        OtpVerification::where('phone_number', $phoneNumber)
            ->where('status', 'pending')
            ->update(['status' => 'expired']);
    }

    /**
     * Update an OTP verification record.
     */
    public function update(OtpVerification $otp, array $data): OtpVerification
    {
        $otp->update($data);
        return $otp->fresh();
    }

    /**
     * Increment the attempt count.
     */
    public function incrementAttempt(OtpVerification $otp): void
    {
        $otp->increment('attempt_count');
    }
}

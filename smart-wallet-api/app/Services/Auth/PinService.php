<?php

namespace App\Services\Auth;

use App\Models\Pin;
use App\Models\User;
use App\Repositories\PinRepository;
use Illuminate\Support\Facades\Hash;

class PinService
{
    public function __construct(
        protected PinRepository $pinRepository
    ) {}

    /**
     * Create a new PIN for a user.
     */
    public function createPin(User $user, string $pin): Pin
    {
        // Delete existing PIN if any
        if ($user->pin) {
            $user->pin->delete();
        }

        return $this->pinRepository->create([
            'user_id' => $user->id,
            'pin_hash' => Hash::make($pin),
            'last_changed_at' => now(),
        ]);
    }

    /**
     * Verify a user's PIN.
     *
     * @return array{success: bool, message: string}
     */
    public function verifyPin(User $user, string $pin): array
    {
        $pinRecord = $this->pinRepository->findByUserId($user->id);

        if (!$pinRecord) {
            return [
                'success' => false,
                'message' => 'PIN not set. Please create a PIN first.',
            ];
        }

        // Check if PIN is locked
        if ($pinRecord->isCurrentlyLocked()) {
            $remainingMinutes = now()->diffInMinutes($pinRecord->locked_until, false);
            return [
                'success' => false,
                'message' => "PIN is locked. Please try again in {$remainingMinutes} minutes.",
            ];
        }

        // Verify the PIN
        if (!Hash::check($pin, $pinRecord->pin_hash)) {
            $this->pinRepository->incrementFailedAttempts($pinRecord);

            $remaining = 5 - $pinRecord->fresh()->failed_attempts;
            $message = $remaining > 0
                ? "Invalid PIN. {$remaining} attempts remaining."
                : 'PIN is now locked due to too many failed attempts. Please try again in 15 minutes.';

            return [
                'success' => false,
                'message' => $message,
            ];
        }

        // Reset failed attempts on success
        $this->pinRepository->resetFailedAttempts($pinRecord);

        return [
            'success' => true,
            'message' => 'PIN verified successfully.',
        ];
    }

    /**
     * Reset a user's PIN (after OTP verification).
     */
    public function resetPin(User $user, string $newPin): Pin
    {
        $pinRecord = $this->pinRepository->findByUserId($user->id);

        if ($pinRecord) {
            $this->pinRepository->update($pinRecord, [
                'pin_hash' => Hash::make($newPin),
                'failed_attempts' => 0,
                'is_locked' => false,
                'locked_until' => null,
                'last_changed_at' => now(),
            ]);
            return $pinRecord->fresh();
        }

        return $this->createPin($user, $newPin);
    }
}

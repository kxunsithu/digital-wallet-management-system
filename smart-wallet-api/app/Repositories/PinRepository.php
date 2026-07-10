<?php

namespace App\Repositories;

use App\Models\Pin;

class PinRepository
{
    /**
     * Create a new PIN record.
     */
    public function create(array $data): Pin
    {
        return Pin::create($data);
    }

    /**
     * Find PIN by user ID.
     */
    public function findByUserId(int $userId): ?Pin
    {
        return Pin::where('user_id', $userId)->first();
    }

    /**
     * Update a PIN record.
     */
    public function update(Pin $pin, array $data): Pin
    {
        $pin->update($data);
        return $pin->fresh();
    }

    /**
     * Increment failed attempts and optionally lock.
     */
    public function incrementFailedAttempts(Pin $pin, int $maxAttempts = 5, int $lockMinutes = 15): void
    {
        $pin->increment('failed_attempts');

        if ($pin->failed_attempts >= $maxAttempts) {
            $pin->update([
                'is_locked' => true,
                'locked_until' => now()->addMinutes($lockMinutes),
            ]);
        }
    }

    /**
     * Reset failed attempts after successful verification.
     */
    public function resetFailedAttempts(Pin $pin): void
    {
        $pin->update([
            'failed_attempts' => 0,
            'is_locked' => false,
            'locked_until' => null,
        ]);
    }
}

<?php

namespace App\Services;

use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class PinService
{
    /**
     * Verify a 4-digit PIN for a user, enforcing a lockout after repeated
     * failures. Resets failure counters on success.
     */
    public function verify(int $userId, string $pin): bool
    {
        $pinRecord = DB::table('pins')->where('user_id', $userId)->first();
        if (! $pinRecord) {
            return false;
        }

        // Enforce PIN lockout after repeated failures
        if ($pinRecord->is_locked) {
            if ($pinRecord->locked_until && Carbon::parse($pinRecord->locked_until)->isFuture()) {
                return false;
            }

            // Lock expired - reset the lockout state
            DB::table('pins')->where('user_id', $userId)->update([
                'failed_attempts' => 0,
                'is_locked' => false,
                'locked_until' => null,
                'updated_at' => now(),
            ]);
            $pinRecord = DB::table('pins')->where('user_id', $userId)->first();
        }

        if (! Hash::check($pin, $pinRecord->pin_hash)) {
            $maxAttempts = 5;
            $failedAttempts = (int) $pinRecord->failed_attempts + 1;

            $update = [
                'failed_attempts' => $failedAttempts,
                'updated_at' => now(),
            ];

            if ($failedAttempts >= $maxAttempts) {
                $update['is_locked'] = true;
                $update['locked_until'] = Carbon::now()->addMinutes(15);
            }

            DB::table('pins')->where('user_id', $userId)->update($update);

            return false;
        }

        // Reset failure counters on success
        DB::table('pins')->where('user_id', $userId)->update([
            'failed_attempts' => 0,
            'is_locked' => false,
            'locked_until' => null,
            'updated_at' => now(),
        ]);

        return true;
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OtpVerification extends Model
{
    protected $fillable = [
        'user_id',
        'phone_number',
        'otp_code',
        'purpose',
        'status',
        'attempt_count',
        'expires_at',
        'verified_at',
        'delivery_status',
    ];

    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'verified_at' => 'datetime',
            'attempt_count' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Check if this OTP has expired.
     */
    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }

    /**
     * Check if max attempts have been reached.
     */
    public function hasExceededAttempts(int $maxAttempts = 5): bool
    {
        return $this->attempt_count >= $maxAttempts;
    }
}

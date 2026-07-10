<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class CustomerProfile extends Model
{
    protected $fillable = [
        'user_id',
        'level',
        'custom_limit_override',
        'kyc_status',
        'referral_code',
        'referred_by',
    ];

    protected function casts(): array
    {
        return [
            'custom_limit_override' => 'decimal:2',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function levelConfig(): BelongsTo
    {
        return $this->belongsTo(CustomerLevelConfig::class, 'level', 'level');
    }

    public function referrer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'referred_by');
    }

    public function nrcVerifications(): HasMany
    {
        return $this->user->nrcVerifications();
    }

    public function latestNrcVerification(): HasOne
    {
        return $this->user->latestNrcVerification();
    }

    /**
     * Get the effective daily transfer limit (custom override or level default).
     */
    public function getEffectiveDailyTransferLimitAttribute(): float
    {
        return (float) ($this->custom_limit_override ?? $this->levelConfig->daily_transfer_limit);
    }

    /**
     * Get the effective monthly transfer limit.
     */
    public function getEffectiveMonthlyTransferLimitAttribute(): float
    {
        return (float) $this->levelConfig->monthly_transfer_limit;
    }

    /**
     * Get the effective max wallet balance.
     */
    public function getEffectiveMaxWalletBalanceAttribute(): float
    {
        return (float) $this->levelConfig->max_wallet_balance;
    }

    /**
     * Get the effective daily cash out limit.
     */
    public function getEffectiveDailyCashOutLimitAttribute(): float
    {
        return (float) $this->levelConfig->daily_cash_out_limit;
    }
}


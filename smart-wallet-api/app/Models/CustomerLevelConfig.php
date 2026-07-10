<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CustomerLevelConfig extends Model
{
    protected $fillable = [
        'level',
        'daily_transfer_limit',
        'monthly_transfer_limit',
        'max_wallet_balance',
        'daily_cash_out_limit',
        'max_transaction_count_daily',
        'can_use_qr_payment',
        'can_receive_from_agent',
        'requires_kyc',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'daily_transfer_limit' => 'decimal:2',
            'monthly_transfer_limit' => 'decimal:2',
            'max_wallet_balance' => 'decimal:2',
            'daily_cash_out_limit' => 'decimal:2',
            'max_transaction_count_daily' => 'integer',
            'can_use_qr_payment' => 'boolean',
            'can_receive_from_agent' => 'boolean',
            'requires_kyc' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    /**
     * Get all customer profiles at this level.
     */
    public function customerProfiles(): HasMany
    {
        return $this->hasMany(CustomerProfile::class, 'level', 'level');
    }
}

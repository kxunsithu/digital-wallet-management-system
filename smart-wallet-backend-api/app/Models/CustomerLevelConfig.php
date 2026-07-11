<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

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
}

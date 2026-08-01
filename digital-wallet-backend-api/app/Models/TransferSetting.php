<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TransferSetting extends Model
{
    use HasFactory;

    protected $table = 'transfer_settings';

    protected $fillable = [
        'unverified_customer_transfer_limit',
        'customer_transfer_fee_percent',
        'merchant_payment_fee_percent',
    ];

    protected $casts = [
        'unverified_customer_transfer_limit' => 'decimal:2',
        'customer_transfer_fee_percent' => 'decimal:2',
        'merchant_payment_fee_percent' => 'decimal:2',
    ];
}

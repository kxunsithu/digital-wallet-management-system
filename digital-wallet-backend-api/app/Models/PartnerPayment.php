<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MerchantPayment extends Model
{
    use HasFactory;

    protected $table = 'merchant_payments';

    protected $fillable = [
        'merchant_id',
        'customer_user_id',
        'amount',
        'fee',
        'status',
        'reference',
        'description',
        'transaction_id',
        'expires_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'fee' => 'decimal:2',
        'expires_at' => 'datetime',
    ];

    public function merchant()
    {
        return $this->belongsTo(Merchant::class);
    }

    public function customer()
    {
        return $this->belongsTo(User::class, 'customer_user_id');
    }

    public function transaction()
    {
        return $this->belongsTo(Transaction::class);
    }
}

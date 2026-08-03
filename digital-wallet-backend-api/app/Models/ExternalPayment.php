<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ExternalPayment extends Model
{
    use HasFactory;

    protected $table = 'external_payments';

    protected $fillable = [
        'reference',
        'external_system_id',
        'customer_user_id',
        'agent_user_id',
        'amount',
        'fee',
        'order_reference',
        'description',
        'redirect_url',
        'status',
        'expires_at',
        'completed_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'fee' => 'decimal:2',
        'expires_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function externalSystem()
    {
        return $this->belongsTo(ExternalSystem::class);
    }

    public function customer()
    {
        return $this->belongsTo(User::class, 'customer_user_id');
    }

    public function agent()
    {
        return $this->belongsTo(User::class, 'agent_user_id');
    }

    public function transaction()
    {
        return $this->hasOne(Transaction::class, 'external_payment_id');
    }
}

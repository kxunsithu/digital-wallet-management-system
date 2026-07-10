<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Transaction extends Model
{
    protected $fillable = [
        'transaction_ref',
        'sender_wallet_id',
        'receiver_wallet_id',
        'transaction_type',
        'amount',
        'fee',
        'qr_id',
        'agent_id',
        'status',
        'pin_verified',
        'description',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'fee' => 'decimal:2',
            'pin_verified' => 'boolean',
        ];
    }

    public function senderWallet(): BelongsTo
    {
        return $this->belongsTo(Wallet::class, 'sender_wallet_id');
    }

    public function receiverWallet(): BelongsTo
    {
        return $this->belongsTo(Wallet::class, 'receiver_wallet_id');
    }

    public function qrCode(): BelongsTo
    {
        return $this->belongsTo(QrCode::class, 'qr_id');
    }

    public function agent(): BelongsTo
    {
        return $this->belongsTo(User::class, 'agent_id');
    }
}

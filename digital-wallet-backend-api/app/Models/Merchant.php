<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Merchant extends Model
{
    use HasFactory;

    protected $table = 'merchants';

    protected $fillable = [
        'user_id',
        'merchant_name',
        'phone_number',
        'api_key',
        'callback_url',
        'status',
    ];

    protected $hidden = [
        'api_key',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function wallet()
    {
        return $this->hasOneThrough(Wallet::class, User::class, 'id', 'user_id', 'user_id', 'id');
    }

    public function payments()
    {
        return $this->hasMany(MerchantPayment::class);
    }
}

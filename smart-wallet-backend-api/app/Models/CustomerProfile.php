<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CustomerProfile extends Model
{
    use HasFactory;

    protected $table = 'customer_profiles';

    protected $fillable = [
        'user_id',
        'custom_limit_override',
        'kyc_status',
        'referral_code',
        'referred_by',
        'state_region_id',
        'township_id',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function referrer()
    {
        return $this->belongsTo(User::class, 'referred_by');
    }

    public function stateRegion()
    {
        return $this->belongsTo(StateRegion::class);
    }

    public function township()
    {
        return $this->belongsTo(Township::class);
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NrcVerification extends Model
{
    protected $fillable = [
        'user_id',
        'nrc_front_image_path',
        'nrc_back_image_path',
        'status',
        'rejection_reason',
        'verified_by',
        'verified_at',
    ];

    protected $casts = [
        'verified_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function verifier()
    {
        return $this->belongsTo(User::class, 'verified_by');
    }
}

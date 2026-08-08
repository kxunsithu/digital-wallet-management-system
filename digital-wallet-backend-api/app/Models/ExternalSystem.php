<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ExternalSystem extends Model
{
    use HasFactory;

    protected $table = 'external_systems';

    protected $fillable = [
        'name',
        'user_id',
        'system_link',
        'system_logo',
        'api_key_hash',
        'api_key_prefix',
        'status',
    ];

    protected $hidden = [
        'api_key_hash',
    ];

    protected $casts = [
        'status' => 'string',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function externalPayments()
    {
        return $this->hasMany(ExternalPayment::class);
    }
}

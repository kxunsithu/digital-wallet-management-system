<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuditLog extends Model
{
    protected $fillable = [
        'user_id',
        'action',
        'target_table',
        'target_id',
        'details',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}

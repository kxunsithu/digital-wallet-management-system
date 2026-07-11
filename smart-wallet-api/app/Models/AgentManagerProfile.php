<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AgentManagerProfile extends Model
{
    protected $fillable = [
        'user_id',
        'manager_code',
        'region',
        'township',
        'status',
        'approval_limit',
        'parent_manager_id',
        'approved_by',
    ];

    protected function casts(): array
    {
        return [
            'approval_limit' => 'decimal:2',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function parentManager(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_manager_id');
    }

    public function subManagers(): HasMany
    {
        return $this->hasMany(self::class, 'parent_manager_id');
    }

    public function approvedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}

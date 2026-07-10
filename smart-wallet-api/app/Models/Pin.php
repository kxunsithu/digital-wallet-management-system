<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Pin extends Model
{
    protected $fillable = [
        'user_id',
        'pin_hash',
        'failed_attempts',
        'is_locked',
        'locked_until',
        'last_changed_at',
    ];

    protected $hidden = [
        'pin_hash',
    ];

    protected function casts(): array
    {
        return [
            'is_locked' => 'boolean',
            'locked_until' => 'datetime',
            'last_changed_at' => 'datetime',
            'failed_attempts' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Check if the PIN is currently locked.
     */
    public function isCurrentlyLocked(): bool
    {
        if (!$this->is_locked) {
            return false;
        }

        // Auto-unlock if lock period has passed
        if ($this->locked_until && $this->locked_until->isPast()) {
            $this->update([
                'is_locked' => false,
                'locked_until' => null,
                'failed_attempts' => 0,
            ]);
            return false;
        }

        return true;
    }
}

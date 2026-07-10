<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

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

    protected function casts(): array
    {
        return [
            'verified_at' => 'datetime',
        ];
    }

    /**
     * Get the user associated with this NRC verification.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the admin who verified this NRC.
     */
    public function verifiedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    /**
     * Check if NRC is pending verification.
     */
    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    /**
     * Check if NRC is approved.
     */
    public function isApproved(): bool
    {
        return $this->status === 'approved';
    }

    /**
     * Check if NRC is rejected.
     */
    public function isRejected(): bool
    {
        return $this->status === 'rejected';
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AgentProfile extends Model
{
    protected $fillable = [
        'user_id',
        'agent_code',
        'level',
        'custom_commission_override',
        'shop_name',
        'shop_address',
        'township',
        'float_balance',
        'parent_agent_id',
        'total_volume_monthly',
        'approved_by',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'float_balance' => 'decimal:2',
            'total_volume_monthly' => 'decimal:2',
            'custom_commission_override' => 'decimal:2',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function levelConfig(): BelongsTo
    {
        return $this->belongsTo(AgentLevelConfig::class, 'level', 'level');
    }

    public function parentAgent(): BelongsTo
    {
        return $this->belongsTo(AgentProfile::class, 'parent_agent_id');
    }

    public function subAgents(): HasMany
    {
        return $this->hasMany(AgentProfile::class, 'parent_agent_id');
    }

    public function approvedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    /**
     * Get the effective commission rate (custom override or level default).
     */
    public function getEffectiveCommissionRateAttribute(): float
    {
        return (float) ($this->custom_commission_override ?? $this->levelConfig->default_commission_rate);
    }

    /**
     * Get the effective daily cash limit.
     */
    public function getEffectiveDailyCashLimitAttribute(): float
    {
        return (float) $this->levelConfig->daily_cash_limit;
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AgentLevelConfig extends Model
{
    protected $fillable = [
        'level',
        'daily_cash_limit',
        'default_commission_rate',
        'min_float_required',
        'can_recruit_sub_agent',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'daily_cash_limit' => 'decimal:2',
            'default_commission_rate' => 'decimal:2',
            'min_float_required' => 'decimal:2',
            'can_recruit_sub_agent' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    /**
     * Get all agent profiles at this level.
     */
    public function agentProfiles(): HasMany
    {
        return $this->hasMany(AgentProfile::class, 'level', 'level');
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

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
}

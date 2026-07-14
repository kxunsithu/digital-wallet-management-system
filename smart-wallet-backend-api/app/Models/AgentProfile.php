<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AgentProfile extends Model
{
    use HasFactory;

    protected $table = 'agent_profiles';

    protected $fillable = [
        'user_id',
        'agent_code',
        'level',
        'custom_commission_override',
        'shop_name',
        'shop_address',
        'state_region_id',
        'township_id',
        'float_balance',
        'parent_agent_id',
        'total_volume_monthly',
        'created_by_manager_id',
        'approved_by',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function parent()
    {
        return $this->belongsTo(self::class, 'parent_agent_id');
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

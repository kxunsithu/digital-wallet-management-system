<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AgentManagerProfile extends Model
{
    use HasFactory;

    protected $table = 'agent_manager_profiles';

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

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function parent()
    {
        return $this->belongsTo(self::class, 'parent_manager_id');
    }

}

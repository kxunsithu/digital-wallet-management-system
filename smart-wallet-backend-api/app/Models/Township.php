<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Township extends Model
{
    use HasFactory;

    protected $fillable = ['state_region_id', 'name'];

    public function stateRegion()
    {
        return $this->belongsTo(StateRegion::class);
    }
}

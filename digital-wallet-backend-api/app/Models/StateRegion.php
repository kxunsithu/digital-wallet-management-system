<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StateRegion extends Model
{
    use HasFactory;

    protected $fillable = ['name'];

    public function townships()
    {
        return $this->hasMany(Township::class);
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Image extends Model
{
    protected $table = 'images';

    protected $fillable = [
        'user_id',
        'image_type',
        'image_path',
        'original_name',
        'image_size',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}

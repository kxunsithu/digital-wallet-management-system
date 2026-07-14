<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Models\AgentProfile;
use App\Models\CustomerProfile;
use App\Models\NrcVerification;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

#[Fillable(['phone_number', 'role_id', 'full_name', 'email', 'nrc_number', 'status', 'is_phone_verified', 'is_pin_created', 'last_login_at'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, HasApiTokens, Notifiable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function customerProfile()
    {
        return $this->hasOne(CustomerProfile::class);
    }

    public function wallet()
    {
        return $this->hasOne(Wallet::class);
    }

    public function agentProfile()
    {
        return $this->hasOne(AgentProfile::class);
    }

    public function nrcVerification()
    {
        return $this->hasOne(NrcVerification::class);
    }

    public function images()
    {
        return $this->hasMany(Image::class);
    }

    public function role()
    {
        return $this->belongsTo(Role::class);
    }
}

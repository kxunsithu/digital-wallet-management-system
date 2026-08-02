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

#[Fillable(['phone_number', 'role_id', 'full_name', 'nrc_number', 'state_region', 'township', 'status', 'is_phone_verified', 'is_pin_created', 'last_login_at'])]
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

    /**
     * Parse the NRC number into its components (state code, township code, type, number).
     * Supports both Myanmar (၁၂/လမန(နိုင်)၁၂၃၄၅၆) and Latin (12/ABCDE(N)123456) formats.
     *
     * @return array{state_code: string, township_code: string, type: string, number: string}|null
     */
    public function nrcParts(): ?array
    {
        if (empty($this->nrc_number)) {
            return null;
        }

        if (preg_match('/^\s*([^\s\/]+)\s*\/\s*([^()]+)\s*\(\s*([^()]+)\s*\)\s*([0-9\x{1040}-\x{1049}]+)\s*$/u', $this->nrc_number, $match)) {
            return [
                'state_code' => trim($match[1]),
                'township_code' => trim($match[2]),
                'type' => trim($match[3]),
                'number' => trim($match[4]),
            ];
        }

        return null;
    }
}

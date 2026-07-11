<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'phone_number',
        'role_id',
        'full_name',
        'email',
        'nrc_number',
        'status',
        'is_phone_verified',
        'is_pin_created',
        'profile_image',
        'last_login_at',
    ];

    protected $hidden = [
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'is_phone_verified' => 'boolean',
            'is_pin_created' => 'boolean',
            'last_login_at' => 'datetime',
        ];
    }

    // ── Relationships ──

    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }

    public function wallet(): HasOne
    {
        return $this->hasOne(Wallet::class);
    }

    public function pin(): HasOne
    {
        return $this->hasOne(Pin::class);
    }

    public function customerProfile(): HasOne
    {
        return $this->hasOne(CustomerProfile::class);
    }

    public function agentProfile(): HasOne
    {
        return $this->hasOne(AgentProfile::class);
    }

    public function agentManagerProfile(): HasOne
    {
        return $this->hasOne(AgentManagerProfile::class);
    }

    public function otpVerifications(): HasMany
    {
        return $this->hasMany(OtpVerification::class);
    }

    public function userDevices(): HasMany
    {
        return $this->hasMany(UserDevice::class);
    }

    public function auditLogs(): HasMany
    {
        return $this->hasMany(AuditLog::class);
    }

    public function nrcVerifications(): HasMany
    {
        return $this->hasMany(NrcVerification::class);
    }

    public function latestNrcVerification(): HasOne
    {
        return $this->hasOne(NrcVerification::class)->latest();
    }

    // ── Helpers ──

    public function isAdmin(): bool
    {
        return $this->role->name === 'admin';
    }

    public function isAgent(): bool
    {
        return $this->role->name === 'agent';
    }

    public function isAgentManager(): bool
    {
        return $this->role->name === 'agent_manager';
    }

    public function isCustomer(): bool
    {
        return $this->role->name === 'customer';
    }

    public function hasRole(string $roleName): bool
    {
        return $this->role->name === $roleName;
    }
}

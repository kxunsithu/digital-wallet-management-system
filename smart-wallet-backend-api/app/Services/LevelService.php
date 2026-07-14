<?php

namespace App\Services;

use App\Models\AgentLevelConfig;
use App\Models\AgentProfile;
use App\Models\CustomerLevelConfig;
use App\Models\CustomerProfile;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class LevelService
{
    public function upgradeUserLevel(User $user, ?float $transactionAmount = null): void
    {
        $roleName = DB::table('roles')->where('id', $user->role_id)->value('name');

        if (strtolower((string) $roleName) === 'customer') {
            $this->upgradeCustomerLevel($user, $transactionAmount);
            return;
        }

        if (strtolower((string) $roleName) === 'agent') {
            $this->upgradeAgentLevel($user, $transactionAmount);
            return;
        }

        if (strtolower((string) $roleName) === 'agent_manager') {
            $this->upgradeAgentManagerLevel($user);
        }
    }

    public function upgradeCustomerLevel(User $user, ?float $transactionAmount = null): void
    {
        $profile = CustomerProfile::firstOrCreate(
            ['user_id' => $user->id],
            ['level' => 'basic', 'kyc_status' => 'pending']
        );

        $hasNrc = ! empty($user->nrc_number);
        $hasVerifiedNrc = DB::table('nrc_verifications')
            ->where('user_id', $user->id)
            ->where('status', 'approved')
            ->exists();

        $targetLevel = $this->resolveCustomerLevel($hasNrc, $hasVerifiedNrc, $transactionAmount);

        $profile->update([
            'level' => $targetLevel,
            'kyc_status' => $hasVerifiedNrc ? 'verified' : $profile->kyc_status,
        ]);
    }

    public function upgradeAgentLevel(User $user, ?float $transactionAmount = null): void
    {
        $profile = AgentProfile::firstOrCreate(
            ['user_id' => $user->id],
            ['agent_code' => 'AG'.str_pad((string) $user->id, 4, '0', STR_PAD_LEFT), 'level' => 'starter']
        );

        $monthlyVolume = (float) $profile->total_volume_monthly;
        if ($transactionAmount !== null) {
            $monthlyVolume += $transactionAmount;
        }

        $hasNrc = ! empty($user->nrc_number);
        $hasVerifiedNrc = DB::table('nrc_verifications')
            ->where('user_id', $user->id)
            ->where('status', 'approved')
            ->exists();

        $targetLevel = $this->resolveAgentLevel($hasNrc, $hasVerifiedNrc, $transactionAmount, $monthlyVolume);

        $profile->update([
            'level' => $targetLevel,
            'total_volume_monthly' => $monthlyVolume,
        ]);
    }

    protected function resolveCustomerLevel(bool $hasNrc, bool $hasVerifiedNrc, ?float $transactionAmount): string
    {
        if ($hasVerifiedNrc && ($transactionAmount !== null && $transactionAmount >= 20000000)) {
            return 'platinum';
        }

        if ($hasVerifiedNrc || ($transactionAmount !== null && $transactionAmount >= 5000000)) {
            return 'gold';
        }

        if ($hasNrc || ($transactionAmount !== null && $transactionAmount >= 1000000)) {
            return 'silver';
        }

        return 'basic';
    }

    protected function resolveAgentLevel(bool $hasNrc, bool $hasVerifiedNrc, ?float $transactionAmount, float $monthlyVolume): string
    {
        if ($hasVerifiedNrc && ($transactionAmount !== null && $transactionAmount >= 20000000 || $monthlyVolume >= 20000000)) {
            return 'elite';
        }

        if ($hasVerifiedNrc || ($transactionAmount !== null && $transactionAmount >= 5000000) || $monthlyVolume >= 10000000) {
            return 'advanced';
        }

        if ($hasNrc || ($transactionAmount !== null && $transactionAmount >= 2000000) || $monthlyVolume >= 5000000) {
            return 'growth';
        }

        return 'starter';
    }

    public function upgradeAgentManagerLevel(User $user): void
    {
        $profile = DB::table('agent_manager_profiles')->where('user_id', $user->id)->first();
        if (! $profile) {
            return;
        }

        $currentLevel = $user->status ?? 'pending';
        if ($currentLevel === 'active') {
            $user->update(['status' => 'active']);
        }
    }
}

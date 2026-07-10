<?php

namespace App\Listeners;

use App\Events\KycApprovedEvent;
use App\Models\AuditLog;
use Illuminate\Support\Facades\Log;

class UpgradeCustomerLevelListener
{
    /**
     * Handle the KYC approved event.
     * Automatically upgrade customer level when KYC is approved.
     */
    public function handle(KycApprovedEvent $event): void
    {
        $user = $event->user;
        $profile = $user->customerProfile;

        if (!$profile) {
            Log::warning('KYC approved but no customer profile found', ['user_id' => $user->id]);
            return;
        }

        // Define upgrade path
        $upgradePath = [
            'basic' => 'silver',
            'silver' => 'gold',
            'gold' => 'platinum',
            'platinum' => 'platinum', // already at max
        ];

        $currentLevel = $profile->level;
        $newLevel = $upgradePath[$currentLevel] ?? $currentLevel;

        if ($newLevel !== $currentLevel) {
            $profile->update([
                'level' => $newLevel,
                'kyc_status' => 'approved',
            ]);

            AuditLog::create([
                'user_id' => $user->id,
                'action' => 'customer_level_upgrade',
                'target_table' => 'customer_profiles',
                'target_id' => $profile->id,
                'details' => "Level upgraded from {$currentLevel} to {$newLevel} after KYC approval",
            ]);

            Log::info('Customer level upgraded', [
                'user_id' => $user->id,
                'from' => $currentLevel,
                'to' => $newLevel,
            ]);
        } else {
            // Just mark KYC as approved even if already at max level
            $profile->update(['kyc_status' => 'approved']);
        }
    }
}

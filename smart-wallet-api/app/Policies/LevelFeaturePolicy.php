<?php

namespace App\Policies;

use App\Exceptions\FeatureNotAvailableException;
use App\Models\User;

class LevelFeaturePolicy
{
    /**
     * Check if user can use QR payment.
     *
     * @throws FeatureNotAvailableException
     */
    public function useQrPayment(User $user): bool
    {
        $profile = $user->customerProfile;

        if (!$profile || !$profile->levelConfig) {
            return true; // Non-customer roles (admin/agent) are not restricted
        }

        if (!$profile->levelConfig->can_use_qr_payment) {
            throw new FeatureNotAvailableException('qr_payment', $profile->level);
        }

        return true;
    }

    /**
     * Check if user can receive from agent.
     *
     * @throws FeatureNotAvailableException
     */
    public function receiveFromAgent(User $user): bool
    {
        $profile = $user->customerProfile;

        if (!$profile || !$profile->levelConfig) {
            return true;
        }

        if (!$profile->levelConfig->can_receive_from_agent) {
            throw new FeatureNotAvailableException('receive_from_agent', $profile->level);
        }

        return true;
    }

    /**
     * Check if agent can recruit sub-agents.
     *
     * @throws FeatureNotAvailableException
     */
    public function recruitSubAgent(User $user): bool
    {
        $profile = $user->agentProfile;

        if (!$profile || !$profile->levelConfig) {
            return false;
        }

        if (!$profile->levelConfig->can_recruit_sub_agent) {
            throw new FeatureNotAvailableException('recruit_sub_agent', $profile->level);
        }

        return true;
    }
}

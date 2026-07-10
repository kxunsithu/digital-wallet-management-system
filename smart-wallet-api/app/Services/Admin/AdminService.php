<?php

namespace App\Services\Admin;

use App\Models\AgentLevelConfig;
use App\Models\AgentProfile;
use App\Models\AuditLog;
use App\Models\CustomerLevelConfig;
use App\Models\User;
use App\Repositories\UserRepository;

class AdminService
{
    public function __construct(
        protected UserRepository $userRepository
    ) {}

    /**
     * Get paginated users with filters.
     */
    public function getUsers(array $filters = [], int $perPage = 15)
    {
        return $this->userRepository->paginate($perPage, $filters);
    }

    /**
     * Update user status.
     */
    public function updateUserStatus(int $userId, string $status, User $admin): array
    {
        $user = $this->userRepository->findById($userId);

        if (!$user) {
            return ['success' => false, 'message' => 'User not found.', 'data' => []];
        }

        $oldStatus = $user->status;
        $this->userRepository->update($user, ['status' => $status]);

        // Audit log
        AuditLog::create([
            'user_id' => $admin->id,
            'action' => 'update_user_status',
            'target_table' => 'users',
            'target_id' => $userId,
            'details' => "Status changed from {$oldStatus} to {$status}",
        ]);

        return [
            'success' => true,
            'message' => 'User status updated successfully.',
            'data' => [
                'user_id' => $user->id,
                'old_status' => $oldStatus,
                'new_status' => $status,
            ],
        ];
    }

    /**
     * Approve an agent.
     */
    public function approveAgent(int $agentProfileId, User $admin): array
    {
        $agentProfile = AgentProfile::with('user')->find($agentProfileId);

        if (!$agentProfile) {
            return ['success' => false, 'message' => 'Agent profile not found.', 'data' => []];
        }

        $agentProfile->update([
            'status' => 'active',
            'approved_by' => $admin->id,
        ]);

        // Activate the user account too
        $agentProfile->user->update(['status' => 'active']);

        AuditLog::create([
            'user_id' => $admin->id,
            'action' => 'approve_agent',
            'target_table' => 'agent_profiles',
            'target_id' => $agentProfileId,
            'details' => "Agent {$agentProfile->agent_code} approved",
        ]);

        return [
            'success' => true,
            'message' => 'Agent approved successfully.',
            'data' => [
                'agent_code' => $agentProfile->agent_code,
                'status' => $agentProfile->status,
            ],
        ];
    }

    /**
     * Get all customer level configs.
     */
    public function getCustomerLevelConfigs()
    {
        return CustomerLevelConfig::all();
    }

    /**
     * Update a customer level config.
     */
    public function updateCustomerLevelConfig(int $id, array $data, User $admin): array
    {
        $config = CustomerLevelConfig::find($id);

        if (!$config) {
            return ['success' => false, 'message' => 'Customer level config not found.', 'data' => []];
        }

        $config->update($data);

        AuditLog::create([
            'user_id' => $admin->id,
            'action' => 'update_customer_level_config',
            'target_table' => 'customer_level_configs',
            'target_id' => $id,
            'details' => json_encode($data),
        ]);

        return [
            'success' => true,
            'message' => 'Customer level config updated.',
            'data' => $config->fresh(),
        ];
    }

    /**
     * Get all agent level configs.
     */
    public function getAgentLevelConfigs()
    {
        return AgentLevelConfig::all();
    }

    /**
     * Update an agent level config.
     */
    public function updateAgentLevelConfig(int $id, array $data, User $admin): array
    {
        $config = AgentLevelConfig::find($id);

        if (!$config) {
            return ['success' => false, 'message' => 'Agent level config not found.', 'data' => []];
        }

        $config->update($data);

        AuditLog::create([
            'user_id' => $admin->id,
            'action' => 'update_agent_level_config',
            'target_table' => 'agent_level_configs',
            'target_id' => $id,
            'details' => json_encode($data),
        ]);

        return [
            'success' => true,
            'message' => 'Agent level config updated.',
            'data' => $config->fresh(),
        ];
    }

    /**
     * Get paginated audit logs.
     */
    public function getAuditLogs(array $filters = [], int $perPage = 20)
    {
        $query = AuditLog::with('user');

        if (isset($filters['user_id'])) {
            $query->where('user_id', $filters['user_id']);
        }

        if (isset($filters['action'])) {
            $query->where('action', $filters['action']);
        }

        if (isset($filters['target_table'])) {
            $query->where('target_table', $filters['target_table']);
        }

        if (isset($filters['date_from'])) {
            $query->whereDate('created_at', '>=', $filters['date_from']);
        }

        if (isset($filters['date_to'])) {
            $query->whereDate('created_at', '<=', $filters['date_to']);
        }

        return $query->latest()->paginate($perPage);
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateAgentLevelConfigRequest;
use App\Http\Requests\Admin\UpdateCustomerLevelConfigRequest;
use App\Http\Requests\Admin\UpdateUserStatusRequest;
use App\Http\Requests\Admin\VerifyNrcRequest;
use App\Http\Resources\AuditLogResource;
use App\Http\Resources\UserResource;
use App\Http\Responses\ApiResponse;
use App\Models\NrcVerification;
use App\Services\Admin\AdminService;
use App\Services\NrcVerificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    public function __construct(
        protected AdminService $adminService,
        protected NrcVerificationService $nrcVerificationService
    ) {}

    /**
     * List all users (paginated, filterable).
     * GET /api/admin/users
     */
    public function users(Request $request): JsonResponse
    {
        $filters = $request->only(['role', 'status', 'search']);
        $perPage = $request->input('per_page', 15);

        $users = $this->adminService->getUsers($filters, $perPage);

        return ApiResponse::success('Users retrieved.', [
            'users' => UserResource::collection($users),
            'pagination' => [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'per_page' => $users->perPage(),
                'total' => $users->total(),
            ],
        ]);
    }

    /**
     * Update a user's status.
     * PATCH /api/admin/users/{id}/status
     */
    public function updateUserStatus(UpdateUserStatusRequest $request, int $id): JsonResponse
    {
        $result = $this->adminService->updateUserStatus($id, $request->status, auth()->user());

        if (!$result['success']) {
            return ApiResponse::notFound($result['message']);
        }

        return ApiResponse::success($result['message'], $result['data']);
    }

    /**
     * Approve an agent.
     * PATCH /api/admin/agents/{id}/approve
     */
    public function approveAgent(int $id): JsonResponse
    {
        $result = $this->adminService->approveAgent($id, auth()->user());

        if (!$result['success']) {
            return ApiResponse::notFound($result['message']);
        }

        return ApiResponse::success($result['message'], $result['data']);
    }

    /**
     * Get all customer level configs.
     * GET /api/admin/customer-level-configs
     */
    public function customerLevelConfigs(): JsonResponse
    {
        $configs = $this->adminService->getCustomerLevelConfigs();

        return ApiResponse::success('Customer level configs retrieved.', $configs);
    }

    /**
     * Update a customer level config.
     * PATCH /api/admin/customer-level-configs/{id}
     */
    public function updateCustomerLevelConfig(UpdateCustomerLevelConfigRequest $request, int $id): JsonResponse
    {
        $result = $this->adminService->updateCustomerLevelConfig(
            $id,
            $request->validated(),
            auth()->user()
        );

        if (!$result['success']) {
            return ApiResponse::notFound($result['message']);
        }

        return ApiResponse::success($result['message'], $result['data']);
    }

    /**
     * Get all agent level configs.
     * GET /api/admin/agent-level-configs
     */
    public function agentLevelConfigs(): JsonResponse
    {
        $configs = $this->adminService->getAgentLevelConfigs();

        return ApiResponse::success('Agent level configs retrieved.', $configs);
    }

    /**
     * Update an agent level config.
     * PATCH /api/admin/agent-level-configs/{id}
     */
    public function updateAgentLevelConfig(UpdateAgentLevelConfigRequest $request, int $id): JsonResponse
    {
        $result = $this->adminService->updateAgentLevelConfig(
            $id,
            $request->validated(),
            auth()->user()
        );

        if (!$result['success']) {
            return ApiResponse::notFound($result['message']);
        }

        return ApiResponse::success($result['message'], $result['data']);
    }

    /**
     * Get paginated audit logs.
     * GET /api/admin/audit-logs
     */
    public function auditLogs(Request $request): JsonResponse
    {
        $filters = $request->only(['user_id', 'action', 'target_table', 'date_from', 'date_to']);
        $perPage = $request->input('per_page', 20);

        $logs = $this->adminService->getAuditLogs($filters, $perPage);

        return ApiResponse::success('Audit logs retrieved.', [
            'audit_logs' => AuditLogResource::collection($logs),
            'pagination' => [
                'current_page' => $logs->currentPage(),
                'last_page' => $logs->lastPage(),
                'per_page' => $logs->perPage(),
                'total' => $logs->total(),
            ],
        ]);
    }

    /**
     * Get all pending NRC verifications.
     * GET /api/admin/nrc-verifications?status=pending
     */
    public function getNrcVerifications(Request $request): JsonResponse
    {
        $status = $request->input('status', 'pending');
        $perPage = $request->input('per_page', 15);

        $nrcVerifications = NrcVerification::with(['user', 'verifiedByUser'])
            ->where('status', $status)
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);

        return ApiResponse::success('NRC verifications retrieved.', [
            'nrc_verifications' => $nrcVerifications->items(),
            'pagination' => [
                'current_page' => $nrcVerifications->currentPage(),
                'last_page' => $nrcVerifications->lastPage(),
                'per_page' => $nrcVerifications->perPage(),
                'total' => $nrcVerifications->total(),
            ],
        ]);
    }

    /**
     * Verify (approve or reject) an NRC.
     * PATCH /api/admin/nrc-verifications/{nrcVerificationId}
     */
    public function verifyNrc(VerifyNrcRequest $request, int $nrcVerificationId): JsonResponse
    {
        $admin = auth()->user();
        $status = $request->input('status');

        if ($status === 'approved') {
            $result = $this->nrcVerificationService->approveNrc($nrcVerificationId, $admin);
        } else {
            $rejectionReason = $request->input('rejection_reason', 'Document quality issue');
            $result = $this->nrcVerificationService->rejectNrc($nrcVerificationId, $rejectionReason, $admin);
        }

        if (!$result['success']) {
            return ApiResponse::notFound($result['message']);
        }

        return ApiResponse::success($result['message'], $result['data']);
    }
}

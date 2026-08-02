<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Wallet\CreditWalletRequest;
use App\Models\Wallet;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class WalletController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $perPage = min(100, max(1, (int) $request->query('per_page', 15)));
        $query = Wallet::with('user.role');

        $isAgentManager = $this->isAgentManager($request);
        $isAdmin = $this->isAdmin($request);

        $includeAdmin = filter_var($request->query('include_admin', false), FILTER_VALIDATE_BOOLEAN);

        if ($isAgentManager && ! $isAdmin) {
            $agentManagerId = $request->user()->id;

            $managedUserIds = DB::table('agent_profiles')
                ->where('parent_agent_id', $agentManagerId)
                ->pluck('user_id')
                ->toArray();

            $managedCustomerIds = DB::table('customer_profiles')
                ->where('referred_by', $agentManagerId)
                ->pluck('user_id')
                ->toArray();

            // Agent managers can always see their own wallet plus wallets of their
            // managed agents and customers.
            $allowedUserIds = array_merge([$agentManagerId], $managedUserIds, $managedCustomerIds);

            // When admin wallets are explicitly requested (e.g. for manager → admin
            // transfers), include admin user IDs in the allowed list.
            if ($includeAdmin) {
                $adminRoleId = DB::table('roles')->where('name', 'admin')->value('id');
                if (! is_null($adminRoleId)) {
                    $adminUserIds = DB::table('users')->where('role_id', $adminRoleId)->pluck('id')->toArray();
                    $allowedUserIds = array_merge($allowedUserIds, $adminUserIds);
                }
            }

            $query->whereIn('user_id', $allowedUserIds);
        }

        $adminId = $request->query('admin_id');

        if (! $includeAdmin) {
            $adminRoleId = DB::table('roles')->where('name', 'admin')->value('id');
            if (! is_null($adminRoleId)) {
                $query->whereHas('user', function ($userQuery) use ($adminRoleId) {
                    $userQuery->where('role_id', '!=', $adminRoleId);
                });
            }
        }

        if ($adminId !== null) {
            $query->where('user_id', (int) $adminId);
        }

        if ($request->filled('user_id')) {
            $query->where('user_id', (int) $request->query('user_id'));
        }

        if ($request->filled('role')) {
            $roleName = $request->query('role');
            $query->whereHas('user.role', function ($q) use ($roleName) {
                $q->where('name', $roleName);
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        $list = $query->orderByDesc('id')->paginate($perPage);

        return response()->json(['success' => true, 'data' => $list], 200);
    }

    public function show(Request $request, $id): JsonResponse
    {
        $wallet = Wallet::with('user.role')->find($id);
        if (! $wallet) {
            return response()->json(['success' => false, 'message' => 'Not found.'], 404);
        }

        if ($this->isAgentManager($request) && ! $this->isAdmin($request)) {
            $agentManagerId = $request->user()->id;

            $managedUserIds = DB::table('agent_profiles')
                ->where('parent_agent_id', $agentManagerId)
                ->pluck('user_id')
                ->toArray();

            $managedCustomerIds = DB::table('customer_profiles')
                ->where('referred_by', $agentManagerId)
                ->pluck('user_id')
                ->toArray();

            // Agent managers can view their own wallet plus wallets of their
            // managed agents and customers.
            $allowedUserIds = array_merge([$agentManagerId], $managedUserIds, $managedCustomerIds);

            if (! in_array($wallet->user_id, $allowedUserIds)) {
                return response()->json(['success' => false, 'message' => 'Forbidden. You can only view your own wallet and wallets of your managed agents and customers.'], 403);
            }
        }

        return response()->json(['success' => true, 'data' => $wallet], 200);
    }

    public function toggleStatus($id): JsonResponse
    {
        $wallet = Wallet::find($id);
        if (! $wallet) {
            return response()->json(['success' => false, 'message' => 'Not found.'], 404);
        }

        $currentStatus = $wallet->status ?? 'inactive';
        $newStatus = $currentStatus === 'active' ? 'inactive' : 'active';
        $wallet->update(['status' => $newStatus]);

        return response()->json([
            'success' => true,
            'message' => 'Wallet status updated.',
            'status' => $newStatus,
            'data' => $wallet->fresh()->load('user.role'),
        ], 200);
    }

    // ─────────────────────── Customer wallet (auth) ─────────────────────────

    public function me(Request $request): JsonResponse
    {
        $wallet = Wallet::with('user.role')->where('user_id', $request->user()->id)->first();
        if (! $wallet) {
            return response()->json(['success' => false, 'message' => 'No wallet found for this account.'], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $wallet->id,
                'wallet_number' => $wallet->wallet_number,
                'balance' => (float) $wallet->balance,
                'status' => $wallet->status,
            ],
        ], 200);
    }

    // ─────────────────────── Admin wallet management ────────────────────────

    public function credit(CreditWalletRequest $request, int $id): JsonResponse
    {
        $wallet = Wallet::find($id);
        if (! $wallet) {
            return response()->json(['success' => false, 'message' => 'Wallet not found.'], 404);
        }

        $data = $request->validated();

        return DB::transaction(function () use ($wallet, $data): JsonResponse {
            $wallet->increment('balance', (string) $data['amount']);

            return response()->json([
                'success' => true,
                'message' => 'Wallet credited successfully.',
                'data' => [
                    'id' => $wallet->id,
                    'balance' => (float) $wallet->fresh()->balance,
                    'credited' => (float) $data['amount'],
                ],
            ], 200);
        });
    }

    protected function isAdmin(Request $request): bool
    {
        $roleName = $request->user()
            ? DB::table('roles')->where('id', $request->user()->role_id)->value('name')
            : null;

        return $roleName === 'admin';
    }

    protected function isAgentManager(Request $request): bool
    {
        return $request->user() && DB::table('agent_manager_profiles')->where('user_id', $request->user()->id)->exists();
    }
}
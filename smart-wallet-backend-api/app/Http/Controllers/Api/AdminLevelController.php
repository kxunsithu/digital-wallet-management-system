<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AgentLevelConfig;
use App\Models\CustomerLevelConfig;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminLevelController extends Controller
{
    public function customerLevels(): JsonResponse
    {
        $levels = CustomerLevelConfig::orderBy('id')->get();

        return response()->json([
            'success' => true,
            'data' => $levels,
        ], 200);
    }

    public function agentLevels(): JsonResponse
    {
        $levels = AgentLevelConfig::orderBy('id')->get();

        return response()->json([
            'success' => true,
            'data' => $levels,
        ], 200);
    }

    public function updateCustomerLevel(Request $request, int $id): JsonResponse
    {
        $level = CustomerLevelConfig::find($id);

        if (! $level) {
            return response()->json(['success' => false, 'message' => 'Customer level not found.'], 404);
        }

        $validated = $request->validate([
            'level' => ['sometimes', 'string', 'max:255'],
            'daily_transfer_limit' => ['sometimes', 'nullable', 'numeric'],
            'monthly_transfer_limit' => ['sometimes', 'nullable', 'numeric'],
            'max_wallet_balance' => ['sometimes', 'nullable', 'numeric'],
            'daily_cash_out_limit' => ['sometimes', 'nullable', 'numeric'],
            'max_transaction_count_daily' => ['sometimes', 'nullable', 'integer'],
            'can_use_qr_payment' => ['sometimes', 'boolean'],
            'can_receive_from_agent' => ['sometimes', 'boolean'],
            'requires_kyc' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $level->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Customer level updated.',
            'data' => $level->fresh(),
        ], 200);
    }

    public function updateAgentLevel(Request $request, int $id): JsonResponse
    {
        $level = AgentLevelConfig::find($id);

        if (! $level) {
            return response()->json(['success' => false, 'message' => 'Agent level not found.'], 404);
        }

        $validated = $request->validate([
            'level' => ['sometimes', 'string', 'max:255'],
            'daily_cash_limit' => ['sometimes', 'nullable', 'numeric'],
            'default_commission_rate' => ['sometimes', 'nullable', 'numeric'],
            'min_float_required' => ['sometimes', 'nullable', 'numeric'],
            'can_recruit_sub_agent' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $level->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Agent level updated.',
            'data' => $level->fresh(),
        ], 200);
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Agent\CashInRequest;
use App\Http\Requests\Agent\CashOutRequest;
use App\Http\Requests\Wallet\TransactionListRequest;
use App\Http\Resources\TransactionResource;
use App\Http\Responses\ApiResponse;
use App\Services\Agent\AgentService;
use Illuminate\Http\JsonResponse;

class AgentController extends Controller
{
    public function __construct(
        protected AgentService $agentService
    ) {}

    /**
     * Cash-in: deposit money into customer's wallet.
     * POST /api/agent/cash-in
     */
    public function cashIn(CashInRequest $request): JsonResponse
    {
        $result = $this->agentService->cashIn(
            auth()->user(),
            $request->customer_wallet_number,
            (float) $request->amount
        );

        if (!$result['success']) {
            return ApiResponse::error($result['message'], null, 422);
        }

        return ApiResponse::success($result['message'], $result['data']);
    }

    /**
     * Cash-out: customer withdraws money via agent.
     * POST /api/agent/cash-out
     */
    public function cashOut(CashOutRequest $request): JsonResponse
    {
        $result = $this->agentService->cashOut(
            auth()->user(),
            $request->customer_wallet_number,
            (float) $request->amount,
            $request->customer_pin
        );

        if (!$result['success']) {
            return ApiResponse::error($result['message'], null, 422);
        }

        return ApiResponse::success($result['message'], $result['data']);
    }

    /**
     * Get agent's transactions.
     * GET /api/agent/transactions
     */
    public function transactions(TransactionListRequest $request): JsonResponse
    {
        $filters = $request->only(['type', 'date_from', 'date_to']);
        $perPage = $request->input('per_page', 15);

        $transactions = $this->agentService->getTransactions(
            auth()->user(),
            $filters,
            $perPage
        );

        return ApiResponse::success('Agent transactions retrieved.', [
            'transactions' => TransactionResource::collection($transactions),
            'pagination' => [
                'current_page' => $transactions->currentPage(),
                'last_page' => $transactions->lastPage(),
                'per_page' => $transactions->perPage(),
                'total' => $transactions->total(),
            ],
        ]);
    }

    /**
     * Get agent profile with effective limits.
     * GET /api/agent/profile
     */
    public function profile(): JsonResponse
    {
        $result = $this->agentService->getProfile(auth()->user());

        if (!$result['success']) {
            return ApiResponse::notFound($result['message']);
        }

        return ApiResponse::success($result['message'], $result['data']);
    }
}

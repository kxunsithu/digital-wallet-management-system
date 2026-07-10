<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Wallet\TransactionListRequest;
use App\Http\Requests\Wallet\TransferRequest;
use App\Http\Resources\TransactionResource;
use App\Http\Responses\ApiResponse;
use App\Services\Wallet\TransferService;
use App\Services\Wallet\WalletService;
use Illuminate\Http\JsonResponse;

class WalletController extends Controller
{
    public function __construct(
        protected WalletService $walletService,
        protected TransferService $transferService
    ) {}

    /**
     * Get wallet balance and effective limits.
     * GET /api/wallet
     */
    public function show(): JsonResponse
    {
        $result = $this->walletService->getWalletInfo(auth()->user());

        if (!$result['success']) {
            return ApiResponse::notFound($result['message']);
        }

        return ApiResponse::success($result['message'], $result['data']);
    }

    /**
     * Transfer money to another wallet.
     * POST /api/wallet/transfer
     */
    public function transfer(TransferRequest $request): JsonResponse
    {
        $result = $this->transferService->transfer(
            auth()->user(),
            $request->receiver_wallet_number,
            (float) $request->amount,
            $request->pin,
            $request->description
        );

        if (!$result['success']) {
            return ApiResponse::error($result['message'], null, 422);
        }

        return ApiResponse::success($result['message'], $result['data']);
    }

    /**
     * Get paginated transaction history.
     * GET /api/wallet/transactions
     */
    public function transactions(TransactionListRequest $request): JsonResponse
    {
        $filters = $request->only(['type', 'status', 'date_from', 'date_to']);
        $perPage = $request->input('per_page', 15);

        $transactions = $this->walletService->getTransactions(
            auth()->user(),
            $filters,
            $perPage
        );

        if (!$transactions) {
            return ApiResponse::notFound('Wallet not found.');
        }

        return ApiResponse::success('Transactions retrieved.', [
            'transactions' => TransactionResource::collection($transactions),
            'pagination' => [
                'current_page' => $transactions->currentPage(),
                'last_page' => $transactions->lastPage(),
                'per_page' => $transactions->perPage(),
                'total' => $transactions->total(),
            ],
        ]);
    }
}

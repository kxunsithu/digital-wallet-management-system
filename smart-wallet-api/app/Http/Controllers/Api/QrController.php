<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Qr\GenerateQrRequest;
use App\Http\Requests\Qr\PayQrRequest;
use App\Http\Requests\Qr\ScanQrRequest;
use App\Http\Responses\ApiResponse;
use App\Services\Qr\QrService;
use Illuminate\Http\JsonResponse;

class QrController extends Controller
{
    public function __construct(
        protected QrService $qrService
    ) {}

    /**
     * Generate a QR code (static or dynamic).
     * POST /api/qr/generate
     */
    public function generate(GenerateQrRequest $request): JsonResponse
    {
        $result = $this->qrService->generate(
            auth()->user(),
            $request->qr_type,
            $request->amount ? (float) $request->amount : null
        );

        if (!$result['success']) {
            return ApiResponse::error($result['message'], null, 422);
        }

        return ApiResponse::created($result['message'], $result['data']);
    }

    /**
     * Scan/resolve a QR code.
     * POST /api/qr/scan
     */
    public function scan(ScanQrRequest $request): JsonResponse
    {
        $result = $this->qrService->scan($request->qr_code_value);

        if (!$result['success']) {
            return ApiResponse::error($result['message'], null, 404);
        }

        return ApiResponse::success($result['message'], $result['data']);
    }

    /**
     * Process a QR payment.
     * POST /api/qr/pay
     */
    public function pay(PayQrRequest $request): JsonResponse
    {
        $result = $this->qrService->pay(
            auth()->user(),
            $request->qr_code_value,
            (float) $request->amount,
            $request->pin
        );

        if (!$result['success']) {
            return ApiResponse::error($result['message'], null, 422);
        }

        return ApiResponse::success($result['message'], $result['data']);
    }
}

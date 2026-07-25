<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\QrCodeResource;
use App\Services\QrCodeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class QrCodeController extends Controller
{
    public function __construct(private readonly QrCodeService $qrCodeService)
    {
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user();
        if (! $user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        $qrCode = $this->qrCodeService->ensureForUser($user);
        if (! $qrCode) {
            return response()->json([
                'success' => false,
                'message' => 'Wallet not found. Complete PIN setup first.',
            ], 422);
        }

        $qrCode->load(['user.role', 'wallet']);

        return response()->json([
            'success' => true,
            'data' => new QrCodeResource($qrCode),
        ], 200);
    }

    public function lookup(Request $request): JsonResponse
    {
        $user = $request->user();
        if (! $user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        $request->validate([
            'value' => ['required', 'string', 'max:512'],
        ]);

        $qrCode = $this->qrCodeService->findActiveByValue($request->query('value'));
        if (! $qrCode) {
            return response()->json([
                'success' => false,
                'message' => 'QR code not found or inactive.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => new QrCodeResource($qrCode),
        ], 200);
    }
}

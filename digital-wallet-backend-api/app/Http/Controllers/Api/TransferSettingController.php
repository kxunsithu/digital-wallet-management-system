<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Transfer\UpdateTransferSettingsRequest;
use App\Services\TransferSettingsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TransferSettingController extends Controller
{
    public function __construct(private readonly TransferSettingsService $settingsService)
    {
    }

    public function show(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $this->settingsService->get(),
        ], 200);
    }

    public function update(UpdateTransferSettingsRequest $request): JsonResponse
    {
        $data = $request->validated();

        if (array_key_exists('unverified_customer_transfer_limit', $data) && $data['unverified_customer_transfer_limit'] === null) {
            $data['unverified_customer_transfer_limit'] = null;
        }

        $settings = $this->settingsService->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Transfer settings updated.',
            'data' => $settings,
        ], 200);
    }
}

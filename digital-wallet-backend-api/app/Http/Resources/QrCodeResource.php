<?php

namespace App\Http\Resources;

use App\Services\QrCodeService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class QrCodeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        /** @var QrCodeService $qrCodeService */
        $qrCodeService = app(QrCodeService::class);

        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'wallet_id' => $this->wallet_id,
            'qr_type' => $this->qr_type,
            'qr_code_value' => $this->qr_code_value,
            'qr_payload' => $qrCodeService->buildPayload($this->resource),
            'amount' => $this->amount !== null ? (float) $this->amount : null,
            'is_active' => (bool) $this->is_active,
            'expires_at' => optional($this->expires_at)?->toISOString(),
            'user' => $this->whenLoaded('user', function () {
                return [
                    'id' => $this->user->id,
                    'full_name' => $this->user->full_name,
                    'phone_number' => $this->user->phone_number,
                    'role' => $this->user->role?->name,
                ];
            }),
            'wallet' => $this->whenLoaded('wallet', function () {
                return [
                    'id' => $this->wallet->id,
                    'wallet_number' => $this->wallet->wallet_number,
                    'status' => $this->wallet->status,
                ];
            }),
            'created_at' => optional($this->created_at)?->toISOString(),
            'updated_at' => optional($this->updated_at)?->toISOString(),
        ];
    }
}

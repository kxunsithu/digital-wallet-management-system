<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class MerchantResource extends JsonResource
{
    public function toArray($request): array
    {
        $data = [
            'id' => $this->id,
            'merchant_name' => $this->merchant_name,
            'phone_number' => $this->phone_number,
            'callback_url' => $this->callback_url,
            'status' => $this->status,
            'created_at' => optional($this->created_at)?->toISOString(),
            'user' => $this->whenLoaded('user', function () {
                return [
                    'id' => $this->user->id,
                    'full_name' => $this->user->full_name,
                    'phone_number' => $this->user->phone_number,
                    'status' => $this->user->status,
                ];
            }),
            'wallet' => $this->whenLoaded('wallet', function () {
                return [
                    'id' => $this->wallet->id,
                    'wallet_number' => $this->wallet->wallet_number,
                    'balance' => $this->wallet->balance,
                    'status' => $this->wallet->status,
                ];
            }),
        ];

        // API key is only exposed on explicit demand (e.g. freshly created merchant)
        if ($request->boolean('show_api_key')) {
            $data['api_key'] = $this->api_key;
        }

        return $data;
    }
}

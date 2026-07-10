<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'phone_number' => $this->phone_number,
            'full_name' => $this->full_name,
            'email' => $this->email,
            'nrc_number' => $this->nrc_number,
            'status' => $this->status,
            'is_phone_verified' => $this->is_phone_verified,
            'is_pin_created' => $this->is_pin_created,
            'profile_image' => $this->profile_image,
            'last_login_at' => $this->last_login_at?->toISOString(),
            'role' => $this->whenLoaded('role', fn () => $this->role->name),
            'wallet' => new WalletResource($this->whenLoaded('wallet')),
            'customer_profile' => $this->whenLoaded('customerProfile', function () {
                return [
                    'level' => $this->customerProfile->level,
                    'kyc_status' => $this->customerProfile->kyc_status,
                    'referral_code' => $this->customerProfile->referral_code,
                ];
            }),
            'agent_profile' => $this->whenLoaded('agentProfile', function () {
                return [
                    'agent_code' => $this->agentProfile->agent_code,
                    'level' => $this->agentProfile->level,
                    'shop_name' => $this->agentProfile->shop_name,
                    'status' => $this->agentProfile->status,
                ];
            }),
            'created_at' => $this->created_at->toISOString(),
        ];
    }
}

<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class UserResource extends JsonResource
{
    public function toArray($request): array
    {
        $images = $this->relationLoaded('images') ? $this->images : $this->loadMissing('images')->images;

        $formattedImages = $images->map(function ($image) {
            $imagePath = $image->image_path;

            return [
                'id' => $image->id,
                'image_type' => $image->image_type,
                'image_path' => $imagePath,
                'image_url' => $imagePath ? Storage::disk('public')->url($imagePath) : null,
                'original_name' => $image->original_name,
                'image_size' => $image->image_size,
            ];
        })->values();

        $agentProfile = $this->relationLoaded('agentProfile') ? $this->agentProfile : $this->loadMissing('agentProfile')->agentProfile;
        $wallet = $this->relationLoaded('wallet') ? $this->wallet : $this->loadMissing('wallet')->wallet;
        $customerProfile = $this->relationLoaded('customerProfile') ? $this->customerProfile : $this->loadMissing('customerProfile')->customerProfile;
        $nrcVerification = $this->relationLoaded('nrcVerification') ? $this->nrcVerification : $this->loadMissing('nrcVerification')->nrcVerification;

        return [
            'id' => $this->id,
            'phone_number' => $this->phone_number,
            'full_name' => $this->full_name,
            'nrc_number' => $this->nrc_number,
            'status' => $this->status,
            'is_phone_verified' => (bool) $this->is_phone_verified,
            'is_pin_created' => (bool) $this->is_pin_created,
            'role_id' => $this->role_id,
            'images' => $formattedImages,
            'nrc_images' => $formattedImages->filter(fn ($image) => in_array($image['image_type'], ['nrc_front_image', 'nrc_back_image'], true))->values(),
            'kyc_status' => $customerProfile ? $customerProfile->kyc_status : null,
            'nrc_verification' => $nrcVerification ? [
                'id' => $nrcVerification->id,
                'status' => $nrcVerification->status,
                'rejection_reason' => $nrcVerification->rejection_reason,
            ] : null,
            'agent_profile' => $agentProfile ? [
                'id' => $agentProfile->id,
                'agent_code' => $agentProfile->agent_code,
                'shop_name' => $agentProfile->shop_name,
                'shop_address' => $agentProfile->shop_address,
                'float_balance' => (float) $agentProfile->float_balance,
                'total_volume_monthly' => (float) $agentProfile->total_volume_monthly,
            ] : null,
            'wallet' => $wallet ? [
                'id' => $wallet->id,
                'wallet_number' => $wallet->wallet_number,
                'balance' => (float) $wallet->balance,
                'status' => $wallet->status,
            ] : null,
            'created_at' => $this->created_at ? (string) $this->created_at : null,
            'updated_at' => $this->updated_at ? (string) $this->updated_at : null,
        ];
    }
}

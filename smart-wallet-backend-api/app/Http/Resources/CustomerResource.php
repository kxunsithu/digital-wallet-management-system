<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class CustomerResource extends JsonResource
{
    public function toArray($request): array
    {
        $user = $this->whenLoaded('user') ? $this->user : null;
        $images = $user && $user->relationLoaded('images') ? $user->images : ($user ? $user->loadMissing('images')->images : collect());
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

        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'level' => $this->level,
            'custom_limit_override' => $this->custom_limit_override !== null ? (float) $this->custom_limit_override : null,
            'kyc_status' => $this->kyc_status,
            'referral_code' => $this->referral_code,
            'referred_by' => $this->referred_by,
            'created_at' => optional($this->created_at)?->toISOString(),
            'updated_at' => optional($this->updated_at)?->toISOString(),
            'user' => $this->whenLoaded('user', function () use ($formattedImages) {
                return [
                    'id' => $this->user->id,
                    'phone_number' => $this->user->phone_number,
                    'full_name' => $this->user->full_name,
                    'images' => $formattedImages,
                    'nrc_images' => $formattedImages->filter(fn ($image) => in_array($image['image_type'], ['nrc_front_image', 'nrc_back_image'], true))->values(),
                ];
            }),
            'referrer' => $this->whenLoaded('referrer', function () {
                return [
                    'id' => $this->referrer->id,
                    'phone_number' => $this->referrer->phone_number,
                    'full_name' => $this->referrer->full_name,
                ];
            }),
        ];
    }
}

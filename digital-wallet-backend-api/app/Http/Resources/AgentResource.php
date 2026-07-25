<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class AgentResource extends JsonResource
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
            'agent_code' => $this->agent_code,
            'shop_name' => $this->shop_name,
            'shop_address' => $this->shop_address,
            'state_region_id' => $this->state_region_id,
            'township_id' => $this->township_id,
            'parent_agent_id' => $this->parent_agent_id,
            'created_by_manager_id' => $this->created_by_manager_id,
            'status' => $this->user?->status,
            'created_at' => optional($this->created_at)?->toISOString(),
            'updated_at' => optional($this->updated_at)?->toISOString(),
            'user' => $this->whenLoaded('user', function () use ($formattedImages) {
                $wallet = $this->user->relationLoaded('wallet') ? $this->user->wallet : $this->user->loadMissing('wallet')->wallet;
                return [
                    'id' => $this->user->id,
                    'phone_number' => $this->user->phone_number,
                    'full_name' => $this->user->full_name,
                    'nrc_number' => $this->user->nrc_number,
                    'images' => $formattedImages,
                    'nrc_images' => $formattedImages->filter(fn ($image) => in_array($image['image_type'], ['nrc_front_image', 'nrc_back_image'], true))->values(),
                    'wallet' => $wallet ? [
                        'id' => $wallet->id,
                        'wallet_number' => $wallet->wallet_number,
                        'balance' => $wallet->balance,
                        'status' => $wallet->status,
                    ] : null,
                ];
            }),
            'parent' => $this->whenLoaded('parent', function () {
                return [
                    'id' => $this->parent->id,
                    'agent_code' => $this->parent->agent_code,
                    'shop_name' => $this->parent->shop_name,
                ];
            }),
            'state_region' => $this->whenLoaded('stateRegion', function () {
                return [
                    'id' => $this->stateRegion->id,
                    'name' => $this->stateRegion->name,
                ];
            }),
            'township' => $this->whenLoaded('township', function () {
                return [
                    'id' => $this->township->id,
                    'name' => $this->township->name,
                ];
            }),
        ];
    }
}

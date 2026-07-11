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

        return [
            'id' => $this->id,
            'phone_number' => $this->phone_number,
            'full_name' => $this->full_name,
            'email' => $this->email,
            'nrc_number' => $this->nrc_number,
            'status' => $this->status,
            'is_phone_verified' => (bool) $this->is_phone_verified,
            'is_pin_created' => (bool) $this->is_pin_created,
            'role_id' => $this->role_id,
            'images' => $formattedImages,
            'nrc_images' => $formattedImages->filter(fn ($image) => in_array($image['image_type'], ['nrc_front_image', 'nrc_back_image'], true))->values(),
            'created_at' => $this->created_at ? (string) $this->created_at : null,
            'updated_at' => $this->updated_at ? (string) $this->updated_at : null,
        ];
    }
}

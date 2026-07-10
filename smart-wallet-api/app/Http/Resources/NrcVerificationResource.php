<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NrcVerificationResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'user' => new UserResource($this->whenLoaded('user')),
            'nrc_front_image' => $this->nrc_front_image_path,
            'nrc_back_image' => $this->nrc_back_image_path,
            'status' => $this->status,
            'rejection_reason' => $this->rejection_reason,
            'verified_by' => $this->verified_by,
            'verified_by_user' => new UserResource($this->whenLoaded('verifiedByUser')),
            'verified_at' => $this->verified_at,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}

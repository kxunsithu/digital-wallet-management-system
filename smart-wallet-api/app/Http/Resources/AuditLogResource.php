<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AuditLogResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'action' => $this->action,
            'target_table' => $this->target_table,
            'target_id' => $this->target_id,
            'details' => $this->details,
            'user' => $this->whenLoaded('user', function () {
                return [
                    'id' => $this->user->id,
                    'full_name' => $this->user->full_name,
                    'phone_number' => $this->user->phone_number,
                ];
            }),
            'created_at' => $this->created_at->toISOString(),
        ];
    }
}

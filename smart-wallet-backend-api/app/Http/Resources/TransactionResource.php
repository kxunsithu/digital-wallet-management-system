<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class TransactionResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return array<string, mixed>
     */
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'transaction_ref' => $this->transaction_ref,
            'sender_wallet_id' => $this->sender_wallet_id,
            'receiver_wallet_id' => $this->receiver_wallet_id,
            'transaction_type' => $this->transaction_type,
            'amount' => (float) $this->amount,
            'fee' => (float) $this->fee,
            'qr_id' => $this->qr_id,
            'agent_id' => $this->agent_id,
            'status' => $this->status,
            'pin_verified' => (bool) $this->pin_verified,
            'description' => $this->description,
            'created_at' => $this->created_at ? (string) $this->created_at : null,
            'updated_at' => $this->updated_at ? (string) $this->updated_at : null,
        ];
    }
}

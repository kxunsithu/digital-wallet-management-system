<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TransactionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'transaction_ref' => $this->transaction_ref,
            'transaction_type' => $this->transaction_type,
            'amount' => (float) $this->amount,
            'fee' => (float) $this->fee,
            'status' => $this->status,
            'pin_verified' => $this->pin_verified,
            'description' => $this->description,
            'sender' => $this->whenLoaded('senderWallet', function () {
                return [
                    'wallet_number' => $this->senderWallet->wallet_number,
                    'name' => $this->senderWallet->user->full_name ?? 'N/A',
                ];
            }),
            'receiver' => $this->whenLoaded('receiverWallet', function () {
                return [
                    'wallet_number' => $this->receiverWallet->wallet_number,
                    'name' => $this->receiverWallet->user->full_name ?? 'N/A',
                ];
            }),
            'created_at' => $this->created_at->toISOString(),
        ];
    }
}

<?php

namespace App\Http\Requests\Transfer;

use Illuminate\Foundation\Http\FormRequest;

class TransferRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'receiver_user_id' => ['nullable', 'integer', 'exists:users,id', 'required_without_all:qr_id,receiver_phone,receiver_wallet_number'],
            'qr_id' => ['nullable', 'integer', 'exists:qr_codes,id', 'required_without_all:receiver_user_id,receiver_phone,receiver_wallet_number'],
            'receiver_phone' => ['nullable', 'string', 'max:32', 'required_without_all:qr_id,receiver_user_id,receiver_wallet_number'],
            'receiver_wallet_number' => ['nullable', 'string', 'max:64', 'exists:wallets,wallet_number', 'required_without_all:qr_id,receiver_user_id,receiver_phone'],
            'amount' => ['nullable', 'numeric', 'min:0.01'],
            'fee' => ['nullable', 'numeric', 'min:0'],
            'pin' => ['required', 'string', 'size:4'],
            'description' => ['nullable', 'string', 'max:255'],
        ];
    }
}

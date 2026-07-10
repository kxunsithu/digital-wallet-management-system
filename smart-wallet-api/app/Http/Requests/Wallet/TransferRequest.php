<?php

namespace App\Http\Requests\Wallet;

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
            'receiver_wallet_number' => ['required', 'string', 'exists:wallets,wallet_number'],
            'amount' => ['required', 'numeric', 'min:100', 'max:50000000'],
            'pin' => ['required', 'string', 'regex:/^\d{4,6}$/'],
            'description' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'amount.min' => 'Minimum transfer amount is 100 MMK.',
            'amount.max' => 'Maximum transfer amount is 50,000,000 MMK.',
            'receiver_wallet_number.exists' => 'Receiver wallet number not found.',
        ];
    }
}

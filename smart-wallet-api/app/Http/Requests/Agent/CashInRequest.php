<?php

namespace App\Http\Requests\Agent;

use Illuminate\Foundation\Http\FormRequest;

class CashInRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'customer_wallet_number' => ['required', 'string', 'exists:wallets,wallet_number'],
            'amount' => ['required', 'numeric', 'min:1000', 'max:200000000'],
        ];
    }

    public function messages(): array
    {
        return [
            'amount.min' => 'Minimum cash-in amount is 1,000 MMK.',
            'customer_wallet_number.exists' => 'Customer wallet not found.',
        ];
    }
}

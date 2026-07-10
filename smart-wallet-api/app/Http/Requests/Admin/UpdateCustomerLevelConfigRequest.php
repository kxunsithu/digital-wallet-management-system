<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCustomerLevelConfigRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'daily_transfer_limit' => ['sometimes', 'numeric', 'min:0'],
            'monthly_transfer_limit' => ['sometimes', 'numeric', 'min:0'],
            'max_wallet_balance' => ['sometimes', 'numeric', 'min:0'],
            'daily_cash_out_limit' => ['sometimes', 'numeric', 'min:0'],
            'max_transaction_count_daily' => ['sometimes', 'integer', 'min:1'],
            'can_use_qr_payment' => ['sometimes', 'boolean'],
            'can_receive_from_agent' => ['sometimes', 'boolean'],
            'requires_kyc' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}

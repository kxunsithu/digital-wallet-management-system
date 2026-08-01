<?php

namespace App\Http\Requests\Transfer;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTransferSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'unverified_customer_transfer_limit' => ['nullable', 'numeric', 'min:0', 'max:100000000'],
            'customer_transfer_fee_percent' => ['required', 'numeric', 'min:0', 'max:100'],
            'merchant_payment_fee_percent' => ['required', 'numeric', 'min:0', 'max:100'],
        ];
    }
}

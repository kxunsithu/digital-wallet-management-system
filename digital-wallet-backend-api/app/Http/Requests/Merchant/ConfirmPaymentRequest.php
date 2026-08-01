<?php

namespace App\Http\Requests\Merchant;

use Illuminate\Foundation\Http\FormRequest;

class ConfirmPaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'payment_id' => ['required', 'integer'],
            'otp_code' => ['required', 'string', 'size:6'],
            'pin' => ['required', 'string', 'size:4'],
        ];
    }
}

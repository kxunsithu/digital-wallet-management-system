<?php

namespace App\Http\Requests\External;

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
            'payment_reference' => ['required', 'string', 'max:32'],
            'otp' => ['required', 'string'],
            'pin' => ['required', 'string', 'size:4'],
        ];
    }
}

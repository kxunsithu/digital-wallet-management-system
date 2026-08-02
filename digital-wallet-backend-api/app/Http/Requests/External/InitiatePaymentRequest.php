<?php

namespace App\Http\Requests\External;

use Illuminate\Foundation\Http\FormRequest;

class InitiatePaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'customer_phone' => ['required', 'string', 'max:20'],
            'amount' => ['required', 'numeric', 'min:0.01', 'max:100000000'],
            'order_reference' => ['nullable', 'string', 'max:64'],
            'description' => ['nullable', 'string', 'max:255'],
        ];
    }
}

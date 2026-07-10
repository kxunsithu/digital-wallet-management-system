<?php

namespace App\Http\Requests\Qr;

use Illuminate\Foundation\Http\FormRequest;

class PayQrRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'qr_code_value' => ['required', 'string'],
            'amount' => ['required', 'numeric', 'min:100'],
            'pin' => ['required', 'string', 'regex:/^\d{4,6}$/'],
        ];
    }
}

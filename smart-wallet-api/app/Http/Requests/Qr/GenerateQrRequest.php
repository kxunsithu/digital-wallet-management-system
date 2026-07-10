<?php

namespace App\Http\Requests\Qr;

use Illuminate\Foundation\Http\FormRequest;

class GenerateQrRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'qr_type' => ['required', 'string', 'in:static,dynamic'],
            'amount' => ['required_if:qr_type,dynamic', 'nullable', 'numeric', 'min:100'],
        ];
    }

    public function messages(): array
    {
        return [
            'amount.required_if' => 'Amount is required for dynamic QR codes.',
        ];
    }
}

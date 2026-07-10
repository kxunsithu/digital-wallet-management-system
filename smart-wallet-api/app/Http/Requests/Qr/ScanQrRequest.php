<?php

namespace App\Http\Requests\Qr;

use Illuminate\Foundation\Http\FormRequest;

class ScanQrRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'qr_code_value' => ['required', 'string'],
        ];
    }
}

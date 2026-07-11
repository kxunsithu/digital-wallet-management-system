<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class ForgotPinRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'phone_number' => ['required', 'string', 'max:20'],
            'otp_code' => ['required', 'string', 'size:6'],
            'new_pin' => ['required', 'string', 'size:4'],
        ];
    }
}

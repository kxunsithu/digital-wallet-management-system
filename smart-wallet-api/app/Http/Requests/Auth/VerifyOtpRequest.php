<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class VerifyOtpRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'phone_number' => ['required', 'string', 'regex:/^(\+?959|09)\d{7,9}$/'],
            'otp_code' => ['required', 'string', 'size:6'],
        ];
    }

    public function messages(): array
    {
        return [
            'otp_code.size' => 'OTP code must be exactly 6 digits.',
        ];
    }
}

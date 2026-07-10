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
            'phone_number' => ['required', 'string', 'regex:/^(\+?959|09)\d{7,9}$/'],
            'otp_code' => ['required', 'string', 'size:6'],
            'new_pin' => ['required', 'string', 'regex:/^\d{4,6}$/'],
            'new_pin_confirmation' => ['required', 'same:new_pin'],
        ];
    }

    public function messages(): array
    {
        return [
            'new_pin.regex' => 'PIN must be 4 to 6 digits.',
            'new_pin_confirmation.same' => 'PIN confirmation does not match.',
        ];
    }
}

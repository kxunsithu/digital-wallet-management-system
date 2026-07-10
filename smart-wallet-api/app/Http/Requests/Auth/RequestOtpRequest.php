<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class RequestOtpRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'phone_number' => ['required', 'string', 'regex:/^(\+?959|09)\d{7,9}$/'],
        ];
    }

    public function messages(): array
    {
        return [
            'phone_number.regex' => 'Please provide a valid Myanmar phone number (e.g., 09xxxxxxxxx or +959xxxxxxxxx).',
        ];
    }
}

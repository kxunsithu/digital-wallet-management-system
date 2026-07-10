<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class VerifyPinRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'pin' => ['required', 'string', 'regex:/^\d{4,6}$/'],
            'device_id' => ['nullable', 'string'],
            'device_name' => ['nullable', 'string'],
        ];
    }
}

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
            'phone_number' => ['required', 'string', 'max:20'],
            'role_id' => ['required', 'integer', 'exists:roles,id'],
            'full_name' => ['nullable', 'string', 'max:255'],
            'nrc_number' => ['nullable', 'string', 'max:50'],
        ];
    }
}

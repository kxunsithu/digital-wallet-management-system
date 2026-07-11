<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class CreatePinRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'pin' => ['required', 'string', 'size:4'],
            'pin_confirmation' => ['nullable', 'string', 'size:4', 'same:pin'],
            'confirm_pin' => ['nullable', 'string', 'size:4', 'same:pin'],
            'full_name' => ['nullable', 'string', 'max:255'],
            'nrc_number' => ['nullable', 'string', 'max:50'],
        ];
    }
}

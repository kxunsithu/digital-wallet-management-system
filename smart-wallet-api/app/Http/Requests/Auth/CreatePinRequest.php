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
            'full_name' => ['required', 'string', 'max:255'],
            'nrc_number' => ['required', 'string', 'max:255', 'unique:users,nrc_number'],
            'pin' => ['required', 'string', 'regex:/^\d{4,6}$/'],
            'pin_confirmation' => ['required', 'same:pin'],
        ];
    }

    public function messages(): array
    {
        return [
            'full_name.required' => 'Full name is required for registration.',
            'nrc_number.required' => 'NRC number is required for registration.',
            'nrc_number.unique' => 'This NRC number is already registered.',
            'pin.regex' => 'PIN must be 4 to 6 digits.',
            'pin_confirmation.same' => 'PIN confirmation does not match.',
        ];
    }
}

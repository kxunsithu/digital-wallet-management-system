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
        $user = \App\Models\User::find($this->input('user_id'));
        $isAdmin = $user && $user->role && $user->role->name === 'admin';

        $rules = [
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'pin' => ['required', 'string', 'regex:/^\d{4,6}$/'],
            'pin_confirmation' => ['required', 'same:pin'],
        ];

        // For admin users, full_name and nrc_number are optional (auto-set during registration)
        // For non-admin users, full_name is required for registration
        if ($isAdmin) {
            $rules['full_name'] = ['nullable', 'string', 'max:255'];
            $rules['nrc_number'] = ['nullable', 'string', 'max:255'];
        } else {
            $rules['full_name'] = ['nullable', 'string', 'max:255'];
            $rules['nrc_number'] = ['required', 'string', 'max:255', 'unique:users,nrc_number'];
        }

        return $rules;
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

    protected function passedValidation(): void
    {
        $user = \App\Models\User::find($this->input('user_id'));
        if ($user && $user->role && $user->role->name === 'admin') {
            $this->merge([
                'full_name' => 'System Admin',
            ]);
        }
    }
}

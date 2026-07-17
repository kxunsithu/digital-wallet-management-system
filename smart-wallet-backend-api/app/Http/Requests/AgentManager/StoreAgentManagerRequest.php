<?php

namespace App\Http\Requests\AgentManager;

use Illuminate\Foundation\Http\FormRequest;

class StoreAgentManagerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // User fields
            'phone_number'      => ['required', 'string', 'unique:users,phone_number'],
            'full_name'         => ['required', 'string', 'max:255'],
            'email'             => ['required', 'email', 'max:255', 'unique:users,email'],
            'nrc_number'        => ['required', 'string', 'max:100', 'unique:users,nrc_number', 'regex:/^[0-9\x{1040}-\x{1049}]{1,2}\s*\/\s*[\p{L}\p{M}]+\s*\(\s*[\p{L}\p{M}]+\s*\)\s*[0-9\x{1040}-\x{1049}]{6}$/u'],

            // Profile fields
            'state_region_id'   => ['required', 'integer', 'exists:state_regions,id'],
            'township_id'       => ['required', 'integer', 'exists:townships,id'],
            'status'            => ['required', 'string', 'in:pending,active,inactive'],
            'parent_manager_id' => ['nullable', 'integer', 'exists:agent_manager_profiles,id'],

            // NRC images
            'nrc_front_image'   => ['required', 'file', 'image', 'mimes:jpeg,jpg,png,webp', 'max:2048'],
            'nrc_back_image'    => ['required', 'file', 'image', 'mimes:jpeg,jpg,png,webp', 'max:2048'],
        ];
    }

    public function messages(): array
    {
        return [
            'phone_number.unique' => 'This phone number is already registered.',
            'email.unique'        => 'This email is already registered.',
            'nrc_number.unique'   => 'This NRC number is already registered.',
            'nrc_number.regex'    => 'Invalid NRC format. E.g. 12/ABCDE(N)123456',
        ];
    }
}

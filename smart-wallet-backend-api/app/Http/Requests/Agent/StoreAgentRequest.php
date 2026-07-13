<?php

namespace App\Http\Requests\Agent;

use Illuminate\Foundation\Http\FormRequest;

class StoreAgentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // User fields
            'phone_number' => ['required', 'string', 'unique:users,phone_number'],
            'full_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'nrc_number' => ['required', 'string', 'max:100', 'unique:users,nrc_number', 'regex:/^\d{1,2}\/[a-zA-Z]+\([a-zA-Z]\)\d{6}$/'],

            // Profile fields
            'shop_name' => ['nullable', 'string', 'max:255'],
            'shop_address' => ['nullable', 'string', 'max:255'],
            'state_region_id' => ['required', 'integer', 'exists:state_regions,id'],
            'township_id' => ['required', 'integer', 'exists:townships,id'],
            'status' => ['required', 'string', 'in:pending,active,inactive'],
            'level' => ['nullable', 'string', 'max:50'],
            'custom_commission_override' => ['nullable', 'numeric'],
            'parent_agent_id' => ['nullable', 'integer', 'exists:agent_profiles,id'],

            // NRC images
            'nrc_front_image' => ['required', 'file', 'image', 'mimes:jpeg,jpg,png,webp', 'max:2048'],
            'nrc_back_image' => ['required', 'file', 'image', 'mimes:jpeg,jpg,png,webp', 'max:2048'],
        ];
    }

    public function messages(): array
    {
        return [
            'phone_number.unique' => 'This phone number is already registered.',
            'email.unique' => 'This email is already registered.',
            'nrc_number.unique' => 'This NRC number is already registered.',
            'nrc_number.regex' => 'Invalid NRC format. E.g. 12/ABCDE(N)123456',
        ];
    }
}

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
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'agent_code' => ['required', 'string', 'max:100', 'unique:agent_profiles,agent_code'],
            'level' => ['nullable', 'string', 'max:50'],
            'custom_commission_override' => ['nullable', 'numeric'],
            'shop_name' => ['nullable', 'string', 'max:255'],
            'shop_address' => ['nullable', 'string', 'max:255'],
            'township' => ['nullable', 'string', 'max:100'],
            'parent_agent_id' => ['nullable', 'integer', 'exists:agent_profiles,id'],
            'created_by_manager_id' => ['nullable', 'integer', 'exists:users,id'],
            'approved_by' => ['nullable', 'integer', 'exists:users,id'],
            'status' => ['nullable', 'string', 'in:pending,active,inactive'],
            'nrc_front_image' => ['required', 'file', 'image', 'mimes:jpeg,jpg,png,webp', 'max:2048'],
            'nrc_back_image' => ['required', 'file', 'image', 'mimes:jpeg,jpg,png,webp', 'max:2048'],
        ];
    }
}

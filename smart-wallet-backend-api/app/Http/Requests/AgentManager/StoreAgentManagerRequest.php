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
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'manager_code' => ['required', 'string', 'max:100', 'unique:agent_manager_profiles,manager_code'],
            'region' => ['nullable', 'string', 'max:100'],
            'township' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', 'string', 'in:pending,active,inactive'],
            'approval_limit' => ['nullable', 'numeric'],
            'parent_manager_id' => ['nullable', 'integer', 'exists:agent_manager_profiles,id'],
            'approved_by' => ['nullable', 'integer', 'exists:users,id'],
            'nrc_front_image' => ['required', 'file', 'image', 'mimes:jpeg,jpg,png,webp', 'max:2048'],
            'nrc_back_image' => ['required', 'file', 'image', 'mimes:jpeg,jpg,png,webp', 'max:2048'],
        ];
    }
}

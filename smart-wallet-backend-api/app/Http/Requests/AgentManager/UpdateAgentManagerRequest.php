<?php

namespace App\Http\Requests\AgentManager;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAgentManagerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $id = $this->route('id') ?? $this->route('agent_manager');

        return [
            'user_id' => ['sometimes', 'integer', 'exists:users,id'],
            'manager_code' => ['sometimes', 'string', 'max:100', "unique:agent_manager_profiles,manager_code,{$id}"],
            'region' => ['nullable', 'string', 'max:100'],
            'township' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', 'string', 'in:pending,active,inactive'],
            'approval_limit' => ['nullable', 'numeric'],
            'parent_manager_id' => ['nullable', 'integer', 'exists:agent_manager_profiles,id'],
            'approved_by' => ['nullable', 'integer', 'exists:users,id'],
        ];
    }
}

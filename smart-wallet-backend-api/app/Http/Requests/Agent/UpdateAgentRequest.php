<?php

namespace App\Http\Requests\Agent;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAgentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $id = $this->route('id') ?? null;

        return [
            'agent_code' => ['sometimes', 'string', 'max:100', "unique:agent_profiles,agent_code,{$id}"],
            'level' => ['nullable', 'string', 'max:50'],
            'custom_commission_override' => ['nullable', 'numeric'],
            'shop_name' => ['nullable', 'string', 'max:255'],
            'shop_address' => ['nullable', 'string', 'max:255'],
            'township' => ['nullable', 'string', 'max:100'],
            'parent_agent_id' => ['nullable', 'integer', 'exists:agent_profiles,id'],
            'approved_by' => ['nullable', 'integer', 'exists:users,id'],
            'status' => ['nullable', 'string', 'in:pending,active,inactive'],
        ];
    }
}

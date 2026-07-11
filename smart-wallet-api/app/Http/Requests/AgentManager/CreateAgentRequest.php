<?php

namespace App\Http\Requests\AgentManager;

use Illuminate\Foundation\Http\FormRequest;

class CreateAgentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'phone_number' => ['required', 'string', 'regex:/^(\+?959|09)\d{7,9}$/', 'unique:users,phone_number'],
            'full_name' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'agent_code' => ['required', 'string', 'max:100', 'unique:agent_profiles,agent_code'],
            'level' => ['nullable', 'string', 'in:level_1,level_2,level_3,master'],
            'shop_name' => ['nullable', 'string', 'max:255'],
            'shop_address' => ['nullable', 'string', 'max:255'],
            'township' => ['nullable', 'string', 'max:255'],
            'float_balance' => ['nullable', 'numeric', 'min:0'],
            'status' => ['nullable', 'string', 'in:active,inactive,suspended'],
        ];
    }
}

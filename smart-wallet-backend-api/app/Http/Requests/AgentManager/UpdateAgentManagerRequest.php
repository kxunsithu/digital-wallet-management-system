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

        // Get the user_id of the profile being updated
        $userId = \App\Models\AgentManagerProfile::find($id)?->user_id;

        return [
            // User fields
            'full_name'         => ['nullable', 'string', 'max:255'],
            'email'             => ['nullable', 'email', 'max:255', "unique:users,email,{$userId}"],
            'nrc_number'        => ['nullable', 'string', 'max:100', "unique:users,nrc_number,{$userId}", 'regex:/^\d{1,2}\/[a-zA-Z]+\([a-zA-Z]\)\d{6}$/'],

            // Profile fields
            'manager_code'      => ['sometimes', 'string', 'max:100', "unique:agent_manager_profiles,manager_code,{$id}"],
            'state_region_id'   => ['nullable', 'integer', 'exists:state_regions,id'],
            'township_id'       => ['nullable', 'integer', 'exists:townships,id'],
            'status'            => ['nullable', 'string', 'in:pending,active,inactive'],
            'approval_limit'    => ['nullable', 'numeric'],
            'parent_manager_id' => ['nullable', 'integer', 'exists:agent_manager_profiles,id'],

            // NRC images
            'nrc_front_image'   => ['nullable', 'file', 'image', 'mimes:jpeg,jpg,png,webp', 'max:2048'],
            'nrc_back_image'    => ['nullable', 'file', 'image', 'mimes:jpeg,jpg,png,webp', 'max:2048'],
        ];
    }

    public function messages(): array
    {
        return [
            'nrc_number.regex' => 'Invalid NRC format. E.g. 12/ABCDE(N)123456',
        ];
    }
}

<?php

namespace App\Http\Requests\Agent;

use App\Models\AgentProfile;
use Illuminate\Foundation\Http\FormRequest;

class UpdateAgentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $id = $this->route('id') ?? $this->route('agent');
        $userId = AgentProfile::find($id)?->user_id;

        return [
            // User fields
            'full_name' => ['nullable', 'string', 'max:255'],
            'nrc_number' => ['nullable', 'string', 'max:100', "unique:users,nrc_number,{$userId}", 'regex:/^[0-9\x{1040}-\x{1049}]{1,2}\s*\/\s*[\p{L}\p{M}]+\s*\(\s*[\p{L}\p{M}]+\s*\)\s*[0-9\x{1040}-\x{1049}]{6}$/u'],

            // Profile fields
            'agent_code' => ['sometimes', 'string', 'max:100', "unique:agent_profiles,agent_code,{$id}"],
            'shop_name' => ['nullable', 'string', 'max:255'],
            'shop_address' => ['nullable', 'string', 'max:255'],
            'state_region_id' => ['nullable', 'integer', 'exists:state_regions,id'],
            'township_id' => ['nullable', 'integer', 'exists:townships,id'],
            'status' => ['nullable', 'string', 'in:pending,active,inactive'],

            'parent_agent_id' => ['nullable', 'integer', 'exists:agent_profiles,id'],

            // NRC images
            'nrc_front_image' => ['nullable', 'file', 'image', 'mimes:jpeg,jpg,png,webp', 'max:2048'],
            'nrc_back_image' => ['nullable', 'file', 'image', 'mimes:jpeg,jpg,png,webp', 'max:2048'],
        ];
    }

    public function messages(): array
    {
        return [
            'nrc_number.regex' => 'Invalid NRC format. E.g. 12/ABCDE(N)123456',
        ];
    }
}

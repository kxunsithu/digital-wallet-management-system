<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAgentLevelConfigRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'daily_cash_limit' => ['sometimes', 'numeric', 'min:0'],
            'default_commission_rate' => ['sometimes', 'numeric', 'min:0', 'max:100'],
            'min_float_required' => ['sometimes', 'numeric', 'min:0'],
            'can_recruit_sub_agent' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}

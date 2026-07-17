<?php

namespace App\Http\Requests\Customer;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCustomerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'custom_limit_override' => ['nullable', 'numeric'],
            'kyc_status' => ['nullable', 'string', 'in:pending,verified,rejected'],
            'referral_code' => ['nullable', 'string', 'max:100', 'unique:customer_profiles,referral_code,' . $this->route('id')],
            'referred_by' => ['nullable', 'integer', 'exists:users,id'],
            'state_region_id' => ['nullable', 'integer', 'exists:state_regions,id'],
            'township_id' => ['nullable', 'integer', 'exists:townships,id'],
        ];
    }
}

<?php

namespace App\Http\Requests\Customer;

use Illuminate\Foundation\Http\FormRequest;

class StoreCustomerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'level' => ['nullable', 'string', 'max:100'],
            'custom_limit_override' => ['nullable', 'numeric'],
            'kyc_status' => ['nullable', 'string', 'in:pending,verified,rejected'],
            'referral_code' => ['nullable', 'string', 'max:100', 'unique:customer_profiles,referral_code'],
            'referred_by' => ['nullable', 'integer', 'exists:users,id'],
        ];
    }
}

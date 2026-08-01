<?php

namespace App\Http\Requests\Merchant;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateMerchantRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $merchantId = (int) $this->route('id');

        return [
            'merchant_name' => ['sometimes', 'string', 'max:255'],
            'phone_number' => ['nullable', 'string', 'max:32', Rule::unique('users', 'phone_number')->ignore($merchantId, 'id')],
            'callback_url' => ['nullable', 'string', 'url', 'max:500'],
            'status' => ['sometimes', 'in:active,inactive'],
        ];
    }
}

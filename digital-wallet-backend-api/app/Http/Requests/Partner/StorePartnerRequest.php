<?php

namespace App\Http\Requests\Merchant;

use Illuminate\Foundation\Http\FormRequest;

class StoreMerchantRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'merchant_name' => ['required', 'string', 'max:255'],
            'phone_number' => ['nullable', 'string', 'max:32', 'unique:users,phone_number'],
            'callback_url' => ['nullable', 'string', 'url', 'max:500'],
        ];
    }
}

<?php

namespace App\Http\Requests\ExternalSystem;

use Illuminate\Foundation\Http\FormRequest;

class StoreExternalSystemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'system_link' => ['nullable', 'url', 'max:255'],
            'system_logo' => ['nullable', 'image', 'mimes:jpeg,jpg,png', 'max:2048'],
        ];
    }
}

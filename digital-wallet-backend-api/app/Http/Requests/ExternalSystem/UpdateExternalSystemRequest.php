<?php

namespace App\Http\Requests\ExternalSystem;

use Illuminate\Foundation\Http\FormRequest;

class UpdateExternalSystemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'system_link' => ['sometimes', 'nullable', 'url', 'max:255'],
            'status' => ['sometimes', 'string', 'in:active,inactive'],
            'system_logo' => ['nullable', 'image', 'mimes:jpeg,jpg,png', 'max:2048'],
        ];
    }
}

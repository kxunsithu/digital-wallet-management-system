<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UploadNrcRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'nrc_front_image' => ['nullable', 'image', 'mimes:jpeg,png,jpg,gif', 'max:5120'], // 5MB
            'nrc_back_image' => ['nullable', 'image', 'mimes:jpeg,png,jpg,gif', 'max:5120'], // 5MB
        ];
    }

    /**
     * Get the error messages for the defined validation rules.
     */
    public function messages(): array
    {
        return [
            'nrc_front_image.image' => 'Front image must be a valid image file.',
            'nrc_front_image.mimes' => 'Front image must be jpeg, png, jpg, or gif.',
            'nrc_front_image.max' => 'Front image size must not exceed 5MB.',
            'nrc_back_image.image' => 'Back image must be a valid image file.',
            'nrc_back_image.mimes' => 'Back image must be jpeg, png, jpg, or gif.',
            'nrc_back_image.max' => 'Back image size must not exceed 5MB.',
        ];
    }
}

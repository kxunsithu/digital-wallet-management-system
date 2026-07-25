<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class CreatePinRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $rules = [
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'pin' => ['required', 'string', 'size:4'],
            'pin_confirmation' => ['nullable', 'string', 'size:4', 'same:pin'],
            'confirm_pin' => ['nullable', 'string', 'size:4', 'same:pin'],
            'full_name' => ['nullable', 'string', 'max:255'],
            'nrc_number' => ['nullable', 'string', 'max:50'],
        ];

        // If user exists and is a customer and missing full_name or nrc_number,
        // require those fields on createPin.
        $userId = $this->input('user_id');
        if ($userId) {
            $user = User::find($userId);
            if ($user) {
                $roleName = null;
                if (! empty($user->role_id)) {
                    $roleName = DB::table('roles')->where('id', $user->role_id)->value('name');
                }

                if (strtolower((string) $roleName) === 'customer') {
                    $needsFullName = empty($user->full_name);
                    $needsNrc = empty($user->nrc_number);

                    if ($needsFullName) {
                        $rules['full_name'] = ['required', 'string', 'max:255'];
                    }
                    if ($needsNrc) {
                        $rules['nrc_number'] = ['required', 'string', 'max:50'];
                    }
                }
            }
        }

        return $rules;
    }
}

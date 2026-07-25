<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\Image;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class UserProfileController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();
        if (! $user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        return (new UserResource($user->load(['role', 'images', 'agentProfile', 'agentProfile.stateRegion', 'agentProfile.township'])))
            ->additional(['success' => true])
            ->response()
            ->setStatusCode(200);
    }

    public function update(Request $request): JsonResponse
    {
        $user = $request->user();
        if (! $user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        $data = $request->validate([
            'full_name' => ['sometimes', 'string', 'max:255'],
            'profile_image' => ['sometimes', 'string', 'max:255'],
            'profile_image_original_name' => ['sometimes', 'nullable', 'string', 'max:255'],
            'profile_image_size' => ['sometimes', 'nullable', 'integer'],
            'nrc_number' => ['sometimes', 'string', 'max:255', 'unique:users,nrc_number,'.$user->id],
        ]);

        $roleName = DB::table('roles')->where('id', $user->role_id)->value('name');
        if (in_array(strtolower((string) $roleName), ['agent', 'agent_manager'])) {
            unset($data['nrc_number']);
        }

        $user->fill($data);
        $user->save();

        if (isset($data['profile_image'])) {
            Image::updateOrCreate(
                ['user_id' => $user->id, 'image_type' => 'profile_image'],
                [
                    'image_path' => $data['profile_image'],
                    'original_name' => $data['profile_image_original_name'] ?? null,
                    'image_size' => $data['profile_image_size'] ?? null,
                ]
            );
        }

        return (new UserResource($user->load(['role', 'images', 'agentProfile', 'agentProfile.stateRegion', 'agentProfile.township'])))
            ->additional(['success' => true, 'message' => 'Profile updated.'])
            ->response()
            ->setStatusCode(200);
    }

    public function uploadProfilePicture(Request $request): JsonResponse
    {
        $user = $request->user();
        if (! $user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        $data = $request->validate([
            'profile_image' => ['required', 'image', 'mimes:jpeg,jpg,png,webp', 'max:2048'],
        ]);

        $file = $data['profile_image'];
        $storedPath = $file->store('profile-pictures', 'public');
        $publicUrl = Storage::disk('public')->url($storedPath);

        Image::updateOrCreate(
            ['user_id' => $user->id, 'image_type' => 'profile_image'],
            [
                'image_path' => $storedPath,
                'original_name' => $file->getClientOriginalName(),
                'image_size' => $file->getSize(),
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Profile picture uploaded successfully.',
            'data' => [
                'image_path' => $storedPath,
                'image_url' => $publicUrl,
                'original_name' => $file->getClientOriginalName(),
                'image_size' => $file->getSize(),
            ],
        ], 200);
    }

    public function changePin(Request $request): JsonResponse
    {
        $user = $request->user();
        if (! $user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        $data = $request->validate([
            'current_pin' => ['required', 'string', 'size:4'],
            'new_pin' => ['required', 'string', 'size:4', 'confirmed'],
        ]);

        $pinRecord = DB::table('pins')->where('user_id', $user->id)->first();
        if (! $pinRecord || ! Hash::check($data['current_pin'], $pinRecord->pin_hash)) {
            return response()->json(['success' => false, 'message' => 'Current PIN is incorrect.'], 422);
        }

        DB::table('pins')->updateOrInsert(
            ['user_id' => $user->id],
            [
                'pin_hash' => Hash::make($data['new_pin']),
                'failed_attempts' => 0,
                'is_locked' => false,
                'locked_until' => null,
                'last_changed_at' => now(),
                'updated_at' => now(),
            ]
        );

        return response()->json(['success' => true, 'message' => 'PIN changed successfully.'], 200);
    }
}

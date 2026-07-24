<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CustomerProfile;
use App\Models\Image;
use App\Models\NrcVerification;
use App\Models\User;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class NrcVerificationController extends Controller
{
    public function __construct()
    {
    }

    public function index(Request $request): JsonResponse
    {
        $query = NrcVerification::with('user')->orderByDesc('id');

        if ($request->has('status')) {
            $query->where('status', $request->query('status'));
        }

        return response()->json([
            'success' => true,
            'data' => $query->get(),
        ], 200);
    }

    public function submit(Request $request): JsonResponse
    {
        $user = $request->user();
        if (! $user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        $roleName = DB::table('roles')->where('id', $user->role_id)->value('name');
        if (strtolower((string) $roleName) === 'admin') {
            return response()->json(['success' => false, 'message' => 'Admins cannot submit NRC verification.'], 403);
        }

        $data = $request->validate([
            'nrc_front_image' => ['required', 'image', 'mimes:jpeg,jpg,png,webp', 'max:2048'],
            'nrc_back_image' => ['required', 'image', 'mimes:jpeg,jpg,png,webp', 'max:2048'],
        ]);

        $frontPath = $data['nrc_front_image']->store('nrc-images', 'public');
        $backPath = $data['nrc_back_image']->store('nrc-images', 'public');

        $verification = NrcVerification::updateOrCreate(
            ['user_id' => $user->id],
            [
                'status' => 'pending',
            ]
        );

        $customerProfile = CustomerProfile::firstOrCreate(
            ['user_id' => $user->id],
            ['kyc_status' => 'pending']
        );
        if ($customerProfile->kyc_status !== 'pending') {
            $customerProfile->update(['kyc_status' => 'pending']);
        }

        Image::updateOrCreate(
            ['user_id' => $user->id, 'image_type' => 'nrc_front_image'],
            [
                'image_path' => $frontPath,
                'original_name' => $data['nrc_front_image']->getClientOriginalName(),
                'image_size' => $data['nrc_front_image']->getSize(),
            ]
        );

        Image::updateOrCreate(
            ['user_id' => $user->id, 'image_type' => 'nrc_back_image'],
            [
                'image_path' => $backPath,
                'original_name' => $data['nrc_back_image']->getClientOriginalName(),
                'image_size' => $data['nrc_back_image']->getSize(),
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'NRC verification submitted.',
            'data' => $verification,
        ], 200);
    }

    public function verify(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        if (! $user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        $roleName = DB::table('roles')->where('id', $user->role_id)->value('name');
        if (strtolower((string) $roleName) !== 'admin') {
            return response()->json(['success' => false, 'message' => 'Forbidden. Admin only.'], 403);
        }

        $verification = NrcVerification::find($id);
        if (! $verification) {
            return response()->json(['success' => false, 'message' => 'Verification not found.'], 404);
        }

        $data = $request->validate([
            'status' => ['required', 'in:verified,rejected'],
            'rejection_reason' => ['nullable', 'string'],
        ]);

        $verification->update([
            'status' => $data['status'],
            'rejection_reason' => $data['rejection_reason'] ?? null,
            'verified_by' => $user->id,
            'verified_at' => now(),
        ]);

        if ($data['status'] === 'verified') {
            $verifiedUser = User::find($verification->user_id);
            if ($verifiedUser) {
                $verifiedUser->update(['nrc_number' => $verifiedUser->nrc_number ?? null]);

                CustomerProfile::firstOrCreate(
                    ['user_id' => $verifiedUser->id],
                    ['kyc_status' => 'verified']
                )->update(['kyc_status' => 'verified']);
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Verification updated.',
            'data' => $verification->fresh(),
        ], 200);
    }

    public function reject(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        if (! $user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        $roleName = DB::table('roles')->where('id', $user->role_id)->value('name');
        if (strtolower((string) $roleName) !== 'admin') {
            return response()->json(['success' => false, 'message' => 'Forbidden. Admin only.'], 403);
        }

        $verification = NrcVerification::find($id);
        if (! $verification) {
            return response()->json(['success' => false, 'message' => 'Verification not found.'], 404);
        }

        $data = $request->validate([
            'rejection_reason' => ['nullable', 'string'],
        ]);

        $verification->update([
            'status' => 'rejected',
            'rejection_reason' => $data['rejection_reason'] ?? null,
            'verified_by' => $user->id,
            'verified_at' => now(),
        ]);

        $rejectedUser = User::find($verification->user_id);
        if ($rejectedUser) {
            CustomerProfile::firstOrCreate(
                ['user_id' => $rejectedUser->id],
                ['kyc_status' => 'rejected']
            )->update(['kyc_status' => 'rejected']);
        }

        return response()->json([
            'success' => true,
            'message' => 'Verification rejected.',
            'data' => $verification->fresh(),
        ], 200);
    }
}

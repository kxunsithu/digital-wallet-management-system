<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UploadNrcRequest;
use App\Http\Resources\UserResource;
use App\Http\Responses\ApiResponse;
use App\Services\NrcVerificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class UserProfileController extends Controller
{
    public function __construct(
        protected NrcVerificationService $nrcVerificationService
    ) {}

    /**
     * Get the authenticated user's profile.
     */
    public function show(): JsonResponse
    {
        $user = auth()->user()->load(['role', 'wallet', 'customerProfile', 'agentProfile']);

        return ApiResponse::success('Profile retrieved successfully.', new UserResource($user));
    }

    /**
     * Update the authenticated user's profile.
     */
    public function update(Request $request): JsonResponse
    {
        $user = auth()->user();

        $validated = $request->validate([
            'full_name' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'nrc_number' => ['nullable', 'string', 'max:255', Rule::unique('users', 'nrc_number')->ignore($user->id)],
            'profile_image' => ['nullable', 'string', 'max:2048'],
        ]);

        $user->fill(array_filter($validated, fn ($value) => $value !== null));
        $user->save();

        $user->refresh();

        return ApiResponse::success('Profile updated successfully.', new UserResource($user->load(['role', 'wallet', 'customerProfile', 'agentProfile'])));
    }

    /**
     * Upload NRC images (front and back).
     * POST /api/profile/nrc/upload
     */
    public function uploadNrc(UploadNrcRequest $request): JsonResponse
    {
        $user = auth()->user();

        // Ensure user is a customer
        if (!$user->isCustomer()) {
            return ApiResponse::forbidden('Only customers can upload NRC images.');
        }

        $frontImage = $request->file('nrc_front_image');
        $backImage = $request->file('nrc_back_image');

        // At least one image is required
        if (!$frontImage && !$backImage) {
            return ApiResponse::unprocessable('At least one NRC image (front or back) is required.');
        }

        $result = $this->nrcVerificationService->uploadNrc($user, $frontImage, $backImage);

        if (!$result['success']) {
            return ApiResponse::error($result['message'], 500);
        }

        return ApiResponse::success($result['message'], $result['data']);
    }

    /**
     * Get NRC verification status.
     * GET /api/profile/nrc/status
     */
    public function getNrcStatus(): JsonResponse
    {
        $user = auth()->user();

        // Ensure user is a customer
        if (!$user->isCustomer()) {
            return ApiResponse::forbidden('Only customers can check NRC status.');
        }

        $nrcStatus = $this->nrcVerificationService->getNrcStatus($user);

        return ApiResponse::success('NRC status retrieved successfully.', $nrcStatus);
    }
}

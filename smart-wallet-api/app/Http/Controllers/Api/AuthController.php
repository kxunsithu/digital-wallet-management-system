<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\CreatePinRequest;
use App\Http\Requests\Auth\ForgotPinRequest;
use App\Http\Requests\Auth\RequestOtpRequest;
use App\Http\Requests\Auth\VerifyOtpRequest;
use App\Http\Requests\Auth\VerifyPinRequest;
use App\Http\Responses\ApiResponse;
use App\Services\Auth\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function __construct(
        protected AuthService $authService
    ) {}

    /**
     * Request OTP for login or registration.
     * POST /api/auth/request-otp
     */
    public function requestOtp(RequestOtpRequest $request): JsonResponse
    {
        $phoneNumber = $request->role === 'admin' ? null : $request->phone_number;
        $result = $this->authService->requestOtp($phoneNumber, $request->role);

        if (!$result['success']) {
            return ApiResponse::error($result['message'], null, 422);
        }

        return ApiResponse::success($result['message'], $result['data']);
    }

    /**
     * Verify OTP code.
     * POST /api/auth/verify-otp
     */
    public function verifyOtp(VerifyOtpRequest $request): JsonResponse
    {
        $result = $this->authService->verifyOtp(
            $request->phone_number,
            $request->otp_code
        );

        if (!$result['success']) {
            return ApiResponse::error($result['message'], null, 422);
        }

        return ApiResponse::success($result['message'], $result['data']);
    }

    /**
     * Create PIN for new user (completes registration).
     * POST /api/auth/create-pin
     */
    public function createPin(CreatePinRequest $request): JsonResponse
    {
        $result = $this->authService->createPin(
            $request->user_id,
            $request->pin,
            $request->full_name,
            $request->nrc_number
        );

        if (!$result['success']) {
            return ApiResponse::error($result['message'], null, 422);
        }

        return ApiResponse::created($result['message'], $result['data']);
    }

    /**
     * Verify PIN for login (after OTP verification).
     * POST /api/auth/verify-pin
     */
    public function verifyPin(VerifyPinRequest $request): JsonResponse
    {
        $deviceInfo = [
            'device_id' => $request->device_id,
            'device_name' => $request->device_name,
            'ip_address' => $request->ip(),
        ];

        $result = $this->authService->verifyPin(
            $request->user_id,
            $request->pin,
            $deviceInfo
        );

        if (!$result['success']) {
            return ApiResponse::error($result['message'], null, 401);
        }

        return ApiResponse::success($result['message'], $result['data']);
    }

    /**
     * Logout (revoke current token).
     * POST /api/auth/logout
     */
    public function logout(Request $request): JsonResponse
    {
        $this->authService->logout($request->user());

        return ApiResponse::success('Logged out successfully.');
    }

    /**
     * Resend OTP.
     * POST /api/auth/resend-otp
     */
    public function resendOtp(RequestOtpRequest $request): JsonResponse
    {
        $result = $this->authService->requestOtp($request->phone_number);

        if (!$result['success']) {
            return ApiResponse::error($result['message'], null, 422);
        }

        return ApiResponse::success('OTP resent successfully.', $result['data']);
    }

    /**
     * Forgot PIN — request OTP for PIN reset.
     * POST /api/auth/forgot-pin
     */
    public function forgotPin(RequestOtpRequest $request): JsonResponse
    {
        $result = $this->authService->forgotPin($request->phone_number);

        if (!$result['success']) {
            return ApiResponse::error($result['message'], null, 422);
        }

        return ApiResponse::success($result['message'], $result['data']);
    }

    /**
     * Reset PIN (after forgot-pin OTP verification).
     * POST /api/auth/reset-pin
     */
    public function resetPin(ForgotPinRequest $request): JsonResponse
    {
        $result = $this->authService->resetPin(
            $request->phone_number,
            $request->otp_code,
            $request->new_pin
        );

        if (!$result['success']) {
            return ApiResponse::error($result['message'], null, 422);
        }

        return ApiResponse::success($result['message'], $result['data']);
    }
}

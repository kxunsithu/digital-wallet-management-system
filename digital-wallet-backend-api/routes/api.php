<?php

use App\Http\Controllers\Api\AgentController;
use App\Http\Controllers\Api\AgentManagerController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\ExternalPaymentController;
use App\Http\Controllers\Api\ExternalSystemController;
use App\Http\Controllers\Api\MoneyTransferController;
use App\Http\Controllers\Api\NrcVerificationController;
use App\Http\Controllers\Api\QrCodeController;
use App\Http\Controllers\Api\TransactionController;
use App\Http\Controllers\Api\TransferSettingController;
use App\Http\Controllers\Api\UserProfileController;
use App\Http\Controllers\Api\WalletController;
use Illuminate\Support\Facades\Route;

/* Welcome Route */
Route::get('/', function () {
    return response()->json(['message' => 'Welcome to the Money Transfer API.'], 200);
});

Route::prefix('auth')->middleware('throttle:10,1')->group(function () {
    Route::post('/request-otp', [AuthController::class, 'requestOtp']);
    Route::post('/verify-otp', [AuthController::class, 'verifyOtp']);
    Route::post('/create-pin', [AuthController::class, 'createPin']);
    Route::post('/verify-pin', [AuthController::class, 'verifyPin']);
    Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum')->withoutMiddleware('throttle:10,1');
    Route::post('/resend-otp', [AuthController::class, 'resendOtp']);
    Route::post('/forgot-pin', [AuthController::class, 'forgotPin']);
    Route::post('/reset-pin', [AuthController::class, 'resetPin']);
});

Route::prefix('agent-managers')->middleware('auth:sanctum')->group(function () {
    // Listing and show require authentication (who can view can be controlled later)
    Route::get('/', [AgentManagerController::class, 'index']);
    Route::post('/', [AgentManagerController::class, 'store'])->middleware('ensure.admin');
    Route::get('/{id}', [AgentManagerController::class, 'show']);
    Route::put('/{id}', [AgentManagerController::class, 'update'])->middleware('ensure.admin');
    Route::delete('/{id}', [AgentManagerController::class, 'destroy'])->middleware('ensure.admin');
    Route::post('/{id}/toggle-status', [AgentManagerController::class, 'toggleStatus'])->middleware('ensure.admin');
});

Route::prefix('agents')->middleware('auth:sanctum')->group(function () {
    Route::get('/', [AgentController::class, 'index']);
    Route::post('/', [AgentController::class, 'store']);
    Route::get('/{id}', [AgentController::class, 'show']);
    Route::put('/{id}', [AgentController::class, 'update']);
    Route::delete('/{id}', [AgentController::class, 'destroy']);
    Route::post('/{id}/toggle-status', [AgentController::class, 'toggleStatus'])->middleware('ensure.admin');
    Route::post('/{id}/toggle-nrc-status', [AgentController::class, 'toggleNrcStatus']);
});

Route::prefix('customers')->middleware(['auth:sanctum', 'ensure.admin'])->group(function () {
    Route::get('/', [CustomerController::class, 'index']);
    Route::get('/{id}', [CustomerController::class, 'show']);
    Route::delete('/{id}', [CustomerController::class, 'destroy']);
    Route::post('/{id}/toggle-status', [CustomerController::class, 'toggleStatus']);
    Route::post('/{id}/toggle-kyc-status', [CustomerController::class, 'toggleKycStatus']);
});

Route::prefix('profile')->middleware('auth:sanctum')->group(function () {
    Route::get('/', [UserProfileController::class, 'show']);
    Route::put('/', [UserProfileController::class, 'update']);
    Route::post('/upload-profile-picture', [UserProfileController::class, 'uploadProfilePicture']);
    Route::post('/change-pin', [UserProfileController::class, 'changePin']);
});

Route::prefix('customer/nrc-verifications')->middleware(['auth:sanctum', 'ensure.customer'])->group(function () {
    Route::post('/submit', [NrcVerificationController::class, 'submit']);
});

Route::prefix('admin/nrc-verifications')->middleware(['auth:sanctum', 'ensure.admin'])->group(function () {
    Route::get('/', [NrcVerificationController::class, 'index']);
    Route::post('/{id}/verify', [NrcVerificationController::class, 'verify']);
    Route::post('/{id}/reject', [NrcVerificationController::class, 'reject']);
});

Route::prefix('transfers')->group(function () {
    Route::post('/admin', [MoneyTransferController::class, 'adminTransfer'])->middleware(['auth:sanctum', 'ensure.admin']);
    Route::post('/manager', [MoneyTransferController::class, 'managerTransfer'])->middleware(['auth:sanctum', 'ensure.agent_manager']);
    Route::post('/agent', [MoneyTransferController::class, 'agentTransfer'])->middleware(['auth:sanctum', 'ensure.agent']);
    Route::post('/customer', [MoneyTransferController::class, 'customerTransfer'])->middleware('auth:sanctum');
    Route::get('/customer/info', [MoneyTransferController::class, 'customerInfo'])->middleware('auth:sanctum');
});

Route::prefix('wallets')->middleware('auth:sanctum')->group(function () {
    Route::get('/me', [WalletController::class, 'me']);
    Route::get('/', [WalletController::class, 'index']);
    Route::get('/{id}', [WalletController::class, 'show']);
    Route::post('/{id}/toggle-status', [WalletController::class, 'toggleStatus'])->middleware('ensure.admin');
    Route::post('/{id}/credit', [WalletController::class, 'credit'])->middleware('ensure.admin');
});

Route::prefix('qr-codes')->middleware('auth:sanctum')->group(function () {
    Route::get('/me', [QrCodeController::class, 'me']);
    Route::get('/lookup', [QrCodeController::class, 'lookup']);
});

Route::prefix('transactions')->middleware('auth:sanctum')->group(function () {
    Route::get('/', [TransactionController::class, 'index']);
    Route::get('/fee-summary', [TransactionController::class, 'feeSummary'])->middleware('ensure.admin');
    Route::get('/{id}', [TransactionController::class, 'show']);
});

Route::prefix('transfer-settings')->middleware(['auth:sanctum', 'ensure.admin'])->group(function () {
    Route::get('/', [TransferSettingController::class, 'show']);
    Route::put('/', [TransferSettingController::class, 'update']);
});

// ─── External system payments (online shopping etc.) ────────────────────────
// These endpoints are authenticated via the X-API-Key header, not Sanctum.
Route::prefix('external/payments')->middleware('external.api')->group(function () {
    Route::post('/initiate', [ExternalPaymentController::class, 'initiate'])->middleware('throttle:10,1');
    Route::post('/confirm', [ExternalPaymentController::class, 'confirm'])->middleware('throttle:30,1');
    Route::get('/{reference}', [ExternalPaymentController::class, 'externalStatus'])->middleware('throttle:60,1');
});

// Resolve an external system's details (name, account name, wallet phone) from its API key.
Route::prefix('external')->middleware('external.api')->group(function () {
    Route::get('/system-info', [ExternalSystemController::class, 'systemInfo'])->middleware('throttle:60,1');
});

Route::prefix('external-payments')->middleware('auth:sanctum')->group(function () {
    Route::get('/mine', [ExternalPaymentController::class, 'myHistory']);
});

Route::prefix('external-payments')->middleware(['auth:sanctum', 'ensure.admin'])->group(function () {
    Route::get('/', [ExternalPaymentController::class, 'index']);
    Route::get('/{id}', [ExternalPaymentController::class, 'show']);
});

Route::prefix('external-systems')->middleware('auth:sanctum')->group(function () {
    Route::get('/active', [ExternalSystemController::class, 'listActive']);
    Route::put('/{id}', [ExternalSystemController::class, 'update'])->where('id', '[0-9]+');
    Route::post('/{id}/update', [ExternalSystemController::class, 'update'])->where('id', '[0-9]+');
});

Route::prefix('external-systems')->middleware(['auth:sanctum', 'ensure.agent'])->group(function () {
    Route::get('/mine', [ExternalSystemController::class, 'mySystems']);
    Route::post('/', [ExternalSystemController::class, 'store']);
    Route::post('/{id}/generate-key', [ExternalSystemController::class, 'generateKey'])->where('id', '[0-9]+');
});

Route::prefix('external-systems')->middleware(['auth:sanctum', 'ensure.admin'])->group(function () {
    Route::get('/', [ExternalSystemController::class, 'index']);
    Route::get('/{id}', [ExternalSystemController::class, 'show'])->where('id', '[0-9]+');
    Route::delete('/{id}', [ExternalSystemController::class, 'destroy'])->where('id', '[0-9]+');
    Route::post('/{id}/toggle-status', [ExternalSystemController::class, 'toggleStatus'])->where('id', '[0-9]+');
});

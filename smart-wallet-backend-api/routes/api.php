<?php

use App\Http\Controllers\Api\AuthController;

use App\Http\Controllers\Api\AgentManagerController;
use App\Http\Controllers\Api\AgentController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\MoneyTransferController;
use App\Http\Controllers\Api\NrcVerificationController;
use App\Http\Controllers\Api\UserProfileController;
use App\Http\Controllers\Api\LocationController;
use App\Http\Controllers\Api\QrCodeController;
use App\Http\Controllers\Api\WalletController;
use App\Http\Controllers\Api\TransactionController;
use Illuminate\Support\Facades\Route;

/* Welcome Route */
Route::get('/', function () {
    return response()->json(['message' => 'Welcome to the Money Transfer API.'], 200);
});

Route::prefix('auth')->group(function () {
    Route::post('/request-otp', [AuthController::class, 'requestOtp']);
    Route::post('/verify-otp', [AuthController::class, 'verifyOtp']);
    Route::post('/create-pin', [AuthController::class, 'createPin']);
    Route::post('/verify-pin', [AuthController::class, 'verifyPin']);
    Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
    Route::post('/resend-otp', [AuthController::class, 'resendOtp']);
    Route::post('/forgot-pin', [AuthController::class, 'forgotPin']);
    Route::post('/reset-pin', [AuthController::class, 'resetPin']);
});

Route::prefix('locations')->group(function () {
    Route::get('/state-regions', [LocationController::class, 'getStateRegions']);
    Route::post('/state-regions', [LocationController::class, 'storeStateRegion'])->middleware(['auth:sanctum', 'ensure.admin']);
    Route::put('/state-regions/{id}', [LocationController::class, 'updateStateRegion'])->middleware(['auth:sanctum', 'ensure.admin']);
    Route::delete('/state-regions/{id}', [LocationController::class, 'deleteStateRegion'])->middleware(['auth:sanctum', 'ensure.admin']);

    Route::get('/townships', [LocationController::class, 'getTownships']);
    Route::post('/townships', [LocationController::class, 'storeTownship'])->middleware(['auth:sanctum', 'ensure.admin']);
    Route::put('/townships/{id}', [LocationController::class, 'updateTownship'])->middleware(['auth:sanctum', 'ensure.admin']);
    Route::delete('/townships/{id}', [LocationController::class, 'deleteTownship'])->middleware(['auth:sanctum', 'ensure.admin']);
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
});

Route::prefix('customers')->group(function () {
    Route::get('/', [CustomerController::class, 'index']);
    Route::get('/{id}', [CustomerController::class, 'show']);
    Route::delete('/{id}', [CustomerController::class, 'destroy'])->middleware('auth:sanctum');
    Route::post('/{id}/toggle-status', [CustomerController::class, 'toggleStatus'])->middleware(['auth:sanctum', 'ensure.admin']);
    Route::post('/{id}/toggle-kyc-status', [CustomerController::class, 'toggleKycStatus'])->middleware(['auth:sanctum', 'ensure.admin']);
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
});

Route::prefix('wallets')->group(function () {
    Route::get('/', [WalletController::class, 'index']);
    Route::get('/{id}', [WalletController::class, 'show']);
    Route::post('/{id}/toggle-status', [WalletController::class, 'toggleStatus'])->middleware(['auth:sanctum', 'ensure.admin']);
});

Route::prefix('qr-codes')->middleware('auth:sanctum')->group(function () {
    Route::get('/me', [QrCodeController::class, 'me']);
    Route::get('/lookup', [QrCodeController::class, 'lookup']);
});

Route::prefix('transactions')->middleware('auth:sanctum')->group(function () {
    Route::get('/', [TransactionController::class, 'index']);
    Route::get('/{id}', [TransactionController::class, 'show']);
});

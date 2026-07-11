<?php

use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AgentController;
use App\Http\Controllers\Api\AgentManagerController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\QrController;
use App\Http\Controllers\Api\UserProfileController;
use App\Http\Controllers\Api\WalletController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\WelcomeController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// ── Public (no auth) ──
Route::get('/v1/welcome', [WelcomeController::class, 'welcome'])->name('welcome');
Route::get('/v1/endpoint', [WelcomeController::class, 'endpoint'])->name('endpoint');

// ── Auth (public, throttled) ──
// ── Auth (public, throttled) ──
Route::prefix('auth')->group(function () {
    Route::post('/request-otp', [AuthController::class, 'requestOtp'])
        ->middleware('throttle:5,1') // 5 requests per minute
        ->name('auth.request-otp');

    Route::post('/verify-otp', [AuthController::class, 'verifyOtp'])
        ->name('auth.verify-otp');

    Route::post('/create-pin', [AuthController::class, 'createPin'])
        ->name('auth.create-pin');

    Route::post('/verify-pin', [AuthController::class, 'verifyPin'])
        ->name('auth.verify-pin');

    Route::post('/resend-otp', [AuthController::class, 'resendOtp'])
        ->middleware('throttle:1,1') // 1 request per minute (rate limited)
        ->name('auth.resend-otp');

    Route::post('/forgot-pin', [AuthController::class, 'forgotPin'])
        ->middleware('throttle:3,1')
        ->name('auth.forgot-pin');

    Route::post('/reset-pin', [AuthController::class, 'resetPin'])
        ->name('auth.reset-pin');

    // Authenticated logout
    Route::post('/logout', [AuthController::class, 'logout'])
        ->middleware('auth:sanctum')
        ->name('auth.logout');
});

// ── User profile (authenticated users) ──
Route::prefix('profile')->middleware('auth:sanctum')->group(function () {
    Route::get('/', [UserProfileController::class, 'show'])->name('profile.show');
    Route::patch('/', [UserProfileController::class, 'update'])->name('profile.update');

    // NRC verification
    Route::post('/nrc/upload', [UserProfileController::class, 'uploadNrc'])->name('profile.nrc.upload');
    Route::get('/nrc/status', [UserProfileController::class, 'getNrcStatus'])->name('profile.nrc.status');
});

// ── Wallet (authenticated customers) ──
Route::prefix('wallet')->middleware('auth:sanctum')->group(function () {
    Route::get('/', [WalletController::class, 'show'])
        ->name('wallet.show');

    Route::post('/transfer', [WalletController::class, 'transfer'])
        ->name('wallet.transfer');

    Route::get('/transactions', [WalletController::class, 'transactions'])
        ->name('wallet.transactions');
});

// ── QR (authenticated users) ──
Route::prefix('qr')->middleware('auth:sanctum')->group(function () {
    Route::post('/generate', [QrController::class, 'generate'])
        ->name('qr.generate');

    Route::post('/scan', [QrController::class, 'scan'])
        ->name('qr.scan');

    Route::post('/pay', [QrController::class, 'pay'])
        ->name('qr.pay');
});

// ── Agent (authenticated agents only) ──
Route::prefix('agent')->middleware(['auth:sanctum', 'role:agent'])->group(function () {
    Route::post('/cash-in', [AgentController::class, 'cashIn'])
        ->name('agent.cash-in');

    Route::post('/cash-out', [AgentController::class, 'cashOut'])
        ->name('agent.cash-out');

    Route::get('/transactions', [AgentController::class, 'transactions'])
        ->name('agent.transactions');

    Route::get('/profile', [AgentController::class, 'profile'])
        ->name('agent.profile');
});

// ── Agent manager (authenticated agent managers only) ──
Route::prefix('agent-manager')->middleware(['auth:sanctum', 'role:agent_manager'])->group(function () {
    Route::get('/agents', [AgentManagerController::class, 'index'])
        ->name('agent-manager.agents.index');

    Route::post('/agents', [AgentManagerController::class, 'createAgent'])
        ->name('agent-manager.agents.create');

    Route::patch('/agents/{id}', [AgentManagerController::class, 'updateAgent'])
        ->name('agent-manager.agents.update');

    Route::delete('/agents/{id}', [AgentManagerController::class, 'destroyAgent'])
        ->name('agent-manager.agents.destroy');
});

// ── Admin (authenticated admins only) ──
Route::prefix('admin')->middleware(['auth:sanctum', 'role:admin'])->group(function () {
    Route::get('/users', [AdminController::class, 'users'])
        ->name('admin.users');

    Route::patch('/users/{id}/status', [AdminController::class, 'updateUserStatus'])
        ->name('admin.users.update-status');

    Route::patch('/agents/{id}/approve', [AdminController::class, 'approveAgent'])
        ->name('admin.agents.approve');

    Route::get('/agent-managers', [AdminController::class, 'agentManagers'])
        ->name('admin.agent-managers.index');

    Route::post('/agent-managers', [AdminController::class, 'createAgentManager'])
        ->name('admin.agent-managers.store');

    Route::patch('/agent-managers/{id}/status', [AdminController::class, 'updateAgentManagerStatus'])
        ->name('admin.agent-managers.update-status');

    Route::get('/customer-level-configs', [AdminController::class, 'customerLevelConfigs'])
        ->name('admin.customer-level-configs.index');

    Route::patch('/customer-level-configs/{id}', [AdminController::class, 'updateCustomerLevelConfig'])
        ->name('admin.customer-level-configs.update');

    Route::get('/agent-level-configs', [AdminController::class, 'agentLevelConfigs'])
        ->name('admin.agent-level-configs.index');

    Route::patch('/agent-level-configs/{id}', [AdminController::class, 'updateAgentLevelConfig'])
        ->name('admin.agent-level-configs.update');

    Route::get('/audit-logs', [AdminController::class, 'auditLogs'])
        ->name('admin.audit-logs');

    // NRC verification routes
    Route::get('/nrc-verifications', [AdminController::class, 'getNrcVerifications'])
        ->name('admin.nrc-verifications.index');

    Route::patch('/nrc-verifications/{nrcVerificationId}', [AdminController::class, 'verifyNrc'])
        ->name('admin.nrc-verifications.verify');
});

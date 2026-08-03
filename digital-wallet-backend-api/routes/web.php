<?php

use App\Http\Controllers\HostedExternalPaymentController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// Hosted payment page — external systems redirect the customer here so the
// backend can collect the OTP and PIN itself.
Route::prefix('external-payments')->group(function () {
    Route::get('/pay/{reference}', [HostedExternalPaymentController::class, 'show'])->name('external-payments.pay');
    Route::post('/pay/{reference}', [HostedExternalPaymentController::class, 'pay'])->name('external-payments.pay.submit');
});

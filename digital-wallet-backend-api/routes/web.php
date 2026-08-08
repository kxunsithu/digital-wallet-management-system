<?php

use App\Http\Controllers\HostedExternalPaymentController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// Fallback storage route to ensure uploaded files in storage/app/public are always accessible via /storage/{path}
Route::get('/storage/{path}', function ($path) {
    $fullPath = storage_path('app/public/' . $path);
    if (! file_exists($fullPath) || is_dir($fullPath)) {
        abort(404);
    }
    $mimeType = mime_content_type($fullPath) ?: 'application/octet-stream';
    return response()->file($fullPath, ['Content-Type' => $mimeType]);
})->where('path', '.*');

// Hosted payment page — external systems redirect the customer here so the
// backend can collect the OTP and PIN itself.
Route::prefix('external-payments')->group(function () {
    Route::get('/pay/{reference}', [HostedExternalPaymentController::class, 'show'])->name('external-payments.pay');
    Route::post('/pay/{reference}', [HostedExternalPaymentController::class, 'pay'])->name('external-payments.pay.submit');
});

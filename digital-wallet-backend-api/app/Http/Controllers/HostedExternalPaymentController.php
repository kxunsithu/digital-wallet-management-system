<?php

namespace App\Http\Controllers;

use App\Models\ExternalPayment;
use App\Services\ExternalPaymentService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;
use Illuminate\View\View;

class HostedExternalPaymentController extends Controller
{
    public function __construct(
        private readonly ExternalPaymentService $paymentService,
    ) {}

    /**
     * Show the hosted payment page where the customer enters OTP and PIN.
     */
    public function show(string $reference): View
    {
        $payment = $this->paymentService->findByReference($reference);
        abort_unless($payment, 404);

        if ($payment->status !== 'pending') {
            return view('external-payments.result', [
                'payment' => $payment,
                'success' => $payment->status === 'completed',
                'message' => $this->statusMessage($payment),
            ]);
        }

        return view('external-payments.pay', ['payment' => $payment]);
    }

    /**
     * Verify OTP + PIN on the hosted page and complete the payment, then
     * redirect back to the external system when a redirect_url was supplied.
     */
    public function pay(Request $request, string $reference): RedirectResponse|View
    {
        $payment = $this->paymentService->findByReference($reference);
        abort_unless($payment, 404);

        $data = $request->validate([
            'otp' => ['required', 'string', 'max:10'],
            'pin' => ['required', 'string', 'size:4'],
        ]);

        $result = $this->paymentService->complete($payment, $data['otp'], $data['pin']);
        $payload = $result->getData(true);
        $success = (bool) ($payload['success'] ?? false);

        $payment->refresh();

        if ($success || $payment->status !== 'pending') {
            $redirectUrl = $payment->redirect_url;

            return $redirectUrl
                ? Redirect::away($this->appendQuery($redirectUrl, [
                    'reference' => $payment->reference,
                    'order_reference' => $payment->order_reference,
                    'status' => $success ? 'success' : 'failed',
                    'message' => $payload['message'] ?? $this->statusMessage($payment),
                ]))
                : view('external-payments.result', [
                    'payment' => $payment,
                    'success' => $success,
                    'message' => $payload['message'] ?? $this->statusMessage($payment),
                ]);
        }

        // Retryable failure (wrong OTP/PIN) — show the form again.
        return Redirect::back()
            ->withErrors(['payment' => $payload['message'] ?? 'Payment could not be completed.'])
            ->withInput();
    }

    protected function appendQuery(string $url, array $params): string
    {
        $separator = str_contains($url, '?') ? '&' : '?';

        return $url.$separator.http_build_query($params);
    }

    protected function statusMessage(ExternalPayment $payment): string
    {
        return match ($payment->status) {
            'completed' => 'Payment completed successfully.',
            'expired' => 'This payment request has expired. Please initiate a new payment.',
            default => 'This payment request is already '.$payment->status.'.',
        };
    }
}

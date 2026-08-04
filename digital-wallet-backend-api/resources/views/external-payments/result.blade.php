<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex, nofollow">
    <title>Payment Result · Digital Wallet</title>
    <link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fontsource-variable/geist@5.3.0/index.css">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: 'Geist Variable', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif;
            background: #F9FAFB;
            color: #10110E;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
        }
        .card {
            background: #FFFFFF;
            border: 1px solid #C7C7C7;
            border-radius: 16px;
            width: 100%;
            max-width: 420px;
            padding: 32px;
            text-align: center;
            box-shadow: 0 20px 45px rgba(16, 17, 14, .08);
        }
        .brand {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 28px;
            padding-bottom: 20px;
            border-bottom: 1px solid #C7C7C7;
            text-align: left;
        }
        .brand-logo {
            width: 40px;
            height: 40px;
            border-radius: 10px;
            background: #b0ff12;
            color: #10110E;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }
        .brand-name { font-weight: 700; font-size: 15px; color: #10110E; }
        .brand-sub { font-size: 12px; color: #6B7280; margin-top: 1px; }
        .icon {
            width: 64px;
            height: 64px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
        }
        .icon.success { background: #b0ff12; color: #10110E; }
        .icon.failed { background: #FF4D4F; color: #FFFFFF; }
        h1 { font-size: 22px; font-weight: 700; color: #10110E; margin-bottom: 8px; letter-spacing: -.02em; }
        .message { color: #6B7280; font-size: 15px; line-height: 1.55; }
        .details {
            background: #FFFFFF;
            border: 1px solid #C7C7C7;
            border-radius: 12px;
            padding: 6px 16px;
            margin-top: 24px;
            font-size: 14px;
        }
        .details .row {
            display: flex;
            justify-content: space-between;
            gap: 12px;
            padding: 11px 0;
            color: #4B5563;
            border-bottom: 1px solid #F3F4F6;
        }
        .details .row:last-child { border-bottom: none; }
        .details .row .label { color: #6B7280; }
        .details .row .value { font-weight: 500; color: #10110E; }
        .details .row.total {
            font-weight: 700;
            color: #10110E;
            border-top: 1px dashed #C7C7C7;
            border-bottom: none;
            margin-top: 4px;
            padding-top: 14px;
            font-size: 15px;
        }
        .details .row.total .value { color: #10110E; }
        .reference {
            font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
            font-size: 12px;
            color: #9CA3AF;
            margin-top: 20px;
            letter-spacing: .04em;
        }
    </style>
</head>
<body>
    <div class="card">
        <div class="brand">
            <div class="brand-logo">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/></svg>
            </div>
            <div>
                <div class="brand-name">Digital Wallet</div>
                <div class="brand-sub">Secure payments</div>
            </div>
        </div>

        @if ($success)
            <div class="icon success">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
            </div>
            <h1>Payment Successful</h1>
        @else
            <div class="icon failed">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </div>
            <h1>Payment Failed</h1>
        @endif
        <p class="message">{{ $message }}</p>

        <div class="details">
            <div class="row">
                <span class="label">Amount</span>
                <span class="value">{{ number_format((float) $payment->amount, 2) }} MMK</span>
            </div>
            <div class="row">
                <span class="label">Fee</span>
                <span class="value">{{ number_format((float) $payment->fee, 2) }} MMK</span>
            </div>
            <div class="row total">
                <span>Total</span>
                <span class="value">{{ number_format(round((float) $payment->amount + (float) $payment->fee, 2), 2) }} MMK</span>
            </div>
        </div>

        <div class="reference">{{ $payment->reference }}</div>
    </div>
</body>
</html>

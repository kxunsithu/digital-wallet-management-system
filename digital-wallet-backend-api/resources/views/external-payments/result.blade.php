<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex, nofollow">
    <title>Payment Result</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: 'Instrument Sans', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif;
            background: linear-gradient(160deg, #0ea5e9 0%, #2563eb 55%, #4f46e5 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
        }
        .card {
            background: #ffffff;
            border-radius: 20px;
            width: 100%;
            max-width: 420px;
            padding: 36px 32px;
            text-align: center;
            box-shadow: 0 24px 60px rgba(15, 23, 42, .35);
        }
        .icon {
            width: 64px;
            height: 64px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 18px;
            font-size: 32px;
            color: #fff;
        }
        .icon.success { background: #16a34a; }
        .icon.failed { background: #dc2626; }
        h1 { font-size: 22px; color: #0f172a; margin-bottom: 8px; }
        .message { color: #475569; font-size: 15px; line-height: 1.5; }
        .details {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 14px;
            margin-top: 22px;
            font-size: 14px;
            color: #334155;
        }
        .details .row { display: flex; justify-content: space-between; padding: 5px 0; }
        .details .row.total { font-weight: 700; color: #0f172a; border-top: 1px dashed #cbd5e1; margin-top: 6px; padding-top: 10px; }
        .reference { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; color: #94a3b8; margin-top: 18px; }
    </style>
</head>
<body>
    <div class="card">
        @if ($success)
            <div class="icon success">&#10003;</div>
            <h1>Payment Successful</h1>
        @else
            <div class="icon failed">&#10005;</div>
            <h1>Payment Failed</h1>
        @endif
        <p class="message">{{ $message }}</p>

        <div class="details">
            <div class="row">
                <span>Amount</span>
                <span>{{ number_format((float) $payment->amount, 2) }} MMK</span>
            </div>
            <div class="row">
                <span>Fee</span>
                <span>{{ number_format((float) $payment->fee, 2) }} MMK</span>
            </div>
            <div class="row total">
                <span>Total</span>
                <span>{{ number_format(round((float) $payment->amount + (float) $payment->fee, 2), 2) }} MMK</span>
            </div>
        </div>

        <div class="reference">{{ $payment->reference }}</div>
    </div>
</body>
</html>

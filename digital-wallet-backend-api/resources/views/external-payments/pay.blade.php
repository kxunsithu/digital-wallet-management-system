<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex, nofollow">
    <title>Confirm Payment</title>
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
            max-width: 440px;
            padding: 32px;
            box-shadow: 0 24px 60px rgba(15, 23, 42, .35);
        }
        .brand {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 6px;
        }
        .brand .logo {
            width: 36px;
            height: 36px;
            border-radius: 10px;
            background: linear-gradient(135deg, #0ea5e9, #4f46e5);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #fff;
            font-weight: 700;
            font-size: 18px;
        }
        .brand .name { font-weight: 600; color: #0f172a; }
        h1 { font-size: 20px; color: #0f172a; margin-bottom: 4px; }
        .subtitle { color: #64748b; font-size: 14px; margin-bottom: 24px; }
        .summary {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 14px;
            padding: 16px;
            margin-bottom: 22px;
        }
        .summary .row {
            display: flex;
            justify-content: space-between;
            padding: 6px 0;
            font-size: 14px;
            color: #334155;
        }
        .summary .row.total {
            border-top: 1px dashed #cbd5e1;
            margin-top: 6px;
            padding-top: 12px;
            font-weight: 700;
            color: #0f172a;
            font-size: 16px;
        }
        .field { margin-bottom: 16px; }
        .field label {
            display: block;
            font-size: 13px;
            font-weight: 600;
            color: #334155;
            margin-bottom: 6px;
        }
        .field input {
            width: 100%;
            padding: 12px 14px;
            border: 1px solid #cbd5e1;
            border-radius: 10px;
            font-size: 16px;
            letter-spacing: .12em;
            text-align: center;
            color: #0f172a;
            outline: none;
            transition: border-color .15s, box-shadow .15s;
        }
        .field input:focus {
            border-color: #2563eb;
            box-shadow: 0 0 0 3px rgba(37, 99, 235, .15);
        }
        .alert {
            background: #fef2f2;
            border: 1px solid #fecaca;
            color: #b91c1c;
            padding: 12px 14px;
            border-radius: 10px;
            font-size: 14px;
            margin-bottom: 16px;
        }
        button {
            width: 100%;
            padding: 14px;
            background: linear-gradient(135deg, #0ea5e9, #4f46e5);
            color: #fff;
            border: none;
            border-radius: 12px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            margin-top: 4px;
            transition: opacity .15s, transform .05s;
        }
        button:hover { opacity: .92; }
        button:active { transform: translateY(1px); }
        .hint { text-align: center; color: #94a3b8; font-size: 12px; margin-top: 14px; }
        .reference { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; color: #94a3b8; margin-top: 16px; text-align: center; }
    </style>
</head>
<body>
    <div class="card">
        <div class="brand">
            <div class="logo">W</div>
            <div class="name">Digital Wallet</div>
        </div>
        <h1>Confirm your payment</h1>
        <p class="subtitle">Pay securely with your Digital Wallet. Enter the OTP sent to your phone and your 4-digit PIN.</p>

        @if ($errors->has('payment'))
            <div class="alert">{{ $errors->first('payment') }}</div>
        @endif

        <div class="summary">
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
            @if ($payment->description)
                <div class="row">
                    <span>Description</span>
                    <span>{{ $payment->description }}</span>
                </div>
            @endif
            @if ($payment->order_reference)
                <div class="row">
                    <span>Order Ref</span>
                    <span>{{ $payment->order_reference }}</span>
                </div>
            @endif
            @if ($payment->externalSystem?->name)
                <div class="row">
                    <span>Merchant</span>
                    <span>{{ $payment->externalSystem->name }}</span>
                </div>
            @endif
        </div>

        <form method="POST" action="{{ route('external-payments.pay', $payment->reference) }}">
            @csrf
            <div class="field">
                <label for="otp">One-Time Password (OTP)</label>
                <input id="otp" name="otp" type="text" inputmode="numeric" maxlength="6" placeholder="000000" required autocomplete="one-time-code" value="{{ old('otp') }}">
            </div>
            <div class="field">
                <label for="pin">PIN</label>
                <input id="pin" name="pin" type="password" inputmode="numeric" maxlength="4" placeholder="••••" required autocomplete="current-password">
            </div>
            <button type="submit">Pay {{ number_format(round((float) $payment->amount + (float) $payment->fee, 2), 2) }} MMK</button>
        </form>

        <div class="hint">Your OTP is valid for a few minutes. This page expires after 10 minutes.</div>
        <div class="reference">{{ $payment->reference }}</div>
    </div>
</body>
</html>

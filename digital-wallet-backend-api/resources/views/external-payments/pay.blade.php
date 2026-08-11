<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex, nofollow">
    <title>Confirm Payment · Digital Wallet</title>
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
            max-width: 440px;
            padding: 32px;
            box-shadow: 0 20px 45px rgba(16, 17, 14, .08);
        }
        .brand {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 28px;
            padding-bottom: 20px;
            border-bottom: 1px solid #C7C7C7;
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
        h1 { font-size: 22px; font-weight: 700; color: #10110E; margin-bottom: 6px; letter-spacing: -.02em; }
        .subtitle { color: #6B7280; font-size: 14px; line-height: 1.55; margin-bottom: 24px; }
        .summary {
            background: #FFFFFF;
            border: 1px solid #C7C7C7;
            border-radius: 12px;
            padding: 6px 16px;
            margin-bottom: 24px;
        }
        .summary .row {
            display: flex;
            justify-content: space-between;
            gap: 12px;
            padding: 11px 0;
            font-size: 14px;
            color: #4B5563;
            border-bottom: 1px solid #F3F4F6;
        }
        .summary .row:last-child { border-bottom: none; }
        .summary .row .label { color: #6B7280; }
        .summary .row .value { font-weight: 500; color: #10110E; text-align: right; word-break: break-word; }
        .summary .row.total {
            font-weight: 700;
            color: #10110E;
            font-size: 16px;
            border-top: 1px dashed #C7C7C7;
            border-bottom: none;
            margin-top: 4px;
            padding-top: 14px;
        }
        .summary .row.total .value { color: #10110E; }
        .field { margin-bottom: 18px; }
        .field label {
            display: block;
            font-size: 13px;
            font-weight: 600;
            color: #10110E;
            margin-bottom: 8px;
        }
        .otp-field { position: relative; }
        .otp-group { display: flex; gap: 8px; justify-content: space-between; }
        .otp-box {
            width: 48px;
            height: 52px;
            border: 1px solid #C7C7C7;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            font-weight: 600;
            color: #10110E;
            background: #FFFFFF;
            transition: border-color .15s, box-shadow .15s;
        }
        .otp-box.filled { border-color: #10110E; }
        .otp-field.focus .otp-box {
            border-color: #10110E;
            box-shadow: 0 0 0 3px rgba(176, 255, 18, .45);
        }
        .otp-ghost {
            position: absolute;
            opacity: 0;
            pointer-events: none;
            width: 1px;
            height: 1px;
            border: 0;
            padding: 0;
            left: 0;
            top: 0;
        }
        .alert {
            background: #FFF1F0;
            border: 1px solid #FFC4C2;
            color: #D4380D;
            padding: 12px 14px;
            border-radius: 10px;
            font-size: 14px;
            line-height: 1.5;
            margin-bottom: 18px;
        }
        button[type="submit"] {
            width: 100%;
            height: 46px;
            background: #b0ff12;
            color: #10110E;
            border: none;
            border-radius: 10px;
            font-size: 15px;
            font-weight: 600;
            font-family: inherit;
            cursor: pointer;
            margin-top: 4px;
            transition: background .15s, transform .05s;
        }
        button[type="submit"]:hover { background: #9DEB00; }
        button[type="submit"]:active { transform: translateY(1px); }
        .hint { text-align: center; color: #9CA3AF; font-size: 12px; line-height: 1.5; margin-top: 16px; }
        .reference {
            font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
            font-size: 12px;
            color: #9CA3AF;
            margin-top: 12px;
            text-align: center;
            letter-spacing: .04em;
        }
        @media (max-width: 420px) {
            .card { padding: 24px 20px; }
            .otp-box { width: 42px; height: 48px; }
        }
        noscript .otp-group { display: none; }
    </style>
    <noscript><style>
        .otp-ghost {
            position: static;
            opacity: 1;
            pointer-events: auto;
            width: 100%;
            height: 46px;
            padding: 0 14px;
            border: 1px solid #C7C7C7;
            border-radius: 10px;
            font-size: 16px;
            letter-spacing: .12em;
            text-align: center;
            color: #10110E;
            background: #FFFFFF;
            font-family: inherit;
        }
        .otp-ghost:focus { outline: none; border-color: #10110E; box-shadow: 0 0 0 3px rgba(176, 255, 18, .45); }
    </style></noscript>
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

        <h1>Confirm your payment</h1>
        <p class="subtitle">Pay securely with your Digital Wallet. Enter the OTP sent to your phone and your 4-digit PIN.</p>

        @if (isset($errors) && $errors->has('payment'))
            <div class="alert">{{ $errors->first('payment') }}</div>
        @endif

        <div class="summary">
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
            @if ($payment->description)
                <div class="row">
                    <span class="label">Description</span>
                    <span class="value">{{ $payment->description }}</span>
                </div>
            @endif
            @if ($payment->order_reference)
                <div class="row">
                    <span class="label">Order Ref</span>
                    <span class="value">{{ $payment->order_reference }}</span>
                </div>
            @endif
            @if ($payment->externalSystem?->name)
                <div class="row">
                    <span class="label">Merchant</span>
                    <span class="value">{{ $payment->externalSystem->name }}</span>
                </div>
            @endif
        </div>

        <form method="POST" action="" autocomplete="off">
            @csrf
            <div class="field">
                <label for="otp">One-Time Password (OTP)</label>
                <div class="otp-field" id="otp-field">
                    <div class="otp-group">
                        <div class="otp-box"></div>
                        <div class="otp-box"></div>
                        <div class="otp-box"></div>
                        <div class="otp-box"></div>
                        <div class="otp-box"></div>
                        <div class="otp-box"></div>
                    </div>
                    <input type="text" id="otp" name="otp" class="otp-ghost" inputmode="numeric" pattern="[0-9]*" maxlength="6" autocomplete="one-time-code" aria-label="One-Time Password (OTP)" value="{{ old('otp') }}">
                </div>
            </div>
            <div class="field">
                <label for="pin">PIN</label>
                <div class="otp-field" id="pin-field">
                    <div class="otp-group">
                        <div class="otp-box"></div>
                        <div class="otp-box"></div>
                        <div class="otp-box"></div>
                        <div class="otp-box"></div>
                    </div>
                    <input type="password" id="pin" name="pin" class="otp-ghost" inputmode="numeric" pattern="[0-9]*" maxlength="4" autocomplete="current-password" aria-label="4-digit PIN">
                </div>
            </div>
            <button type="submit">Pay {{ number_format(round((float) $payment->amount + (float) $payment->fee, 2), 2) }} MMK</button>
        </form>

        <div class="hint">Your OTP is valid for a few minutes. This page expires after 10 minutes.</div>
        <div class="reference">{{ $payment->reference }}</div>
    </div>

    <script>
        (function () {
            function initOtp(wrapperId, inputId, length) {
                var field = document.getElementById(wrapperId);
                if (!field) return;
                var ghost = document.getElementById(inputId);
                var boxes = field.querySelectorAll('.otp-box');

                function fill() {
                    var v = (ghost.value || '').replace(/\D/g, '').slice(0, length);
                    boxes.forEach(function (box, i) {
                        box.textContent = v[i] || '';
                        box.classList.toggle('filled', !!v[i]);
                    });
                }

                ghost.value = ghost.value || '';
                fill();

                field.addEventListener('click', function () {
                    ghost.focus();
                    field.classList.add('focus');
                });
                ghost.addEventListener('focus', function () { field.classList.add('focus'); });
                ghost.addEventListener('blur', function () { field.classList.remove('focus'); });
                ghost.addEventListener('input', function () {
                    ghost.value = ghost.value.replace(/\D/g, '').slice(0, length);
                    fill();
                });
                ghost.addEventListener('keydown', function (e) {
                    if (e.key === 'Backspace') {
                        e.preventDefault();
                        ghost.value = ghost.value.slice(0, -1);
                        fill();
                    }
                });
            }

            initOtp('otp-field', 'otp', 6);
            initOtp('pin-field', 'pin', 4);
        })();
    </script>
</body>
</html>

<?php

namespace App\Services;

use App\Models\QrCode;
use App\Models\User;
use App\Models\Wallet;
use Illuminate\Support\Str;

class QrCodeService
{
    public function ensureForUser(User $user): ?QrCode
    {
        $wallet = Wallet::where('user_id', $user->id)->first();
        if (! $wallet) {
            return null;
        }

        $existing = QrCode::query()
            ->where('user_id', $user->id)
            ->where('wallet_id', $wallet->id)
            ->where('qr_type', 'static')
            ->where('is_active', true)
            ->whereNull('expires_at')
            ->first();

        if ($existing) {
            return $existing;
        }

        return QrCode::create([
            'user_id' => $user->id,
            'wallet_id' => $wallet->id,
            'qr_type' => 'static',
            'qr_code_value' => $this->generateUniqueValue(),
            'amount' => null,
            'is_active' => true,
            'expires_at' => null,
        ]);
    }

    public function findActiveByValue(string $value): ?QrCode
    {
        $normalizedValue = $this->extractCodeValue($value);

        return QrCode::query()
            ->with(['user.role', 'wallet'])
            ->where('qr_code_value', $normalizedValue)
            ->where('is_active', true)
            ->where(function ($query): void {
                $query->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now());
            })
            ->first();
    }

    public function buildPayload(QrCode $qrCode): string
    {
        return json_encode([
            'app' => 'smart-wallet',
            'qr_code_value' => $qrCode->qr_code_value,
        ], JSON_THROW_ON_ERROR);
    }

    protected function extractCodeValue(string $rawValue): string
    {
        $trimmed = trim($rawValue);
        if ($trimmed === '') {
            return '';
        }

        $decoded = json_decode($trimmed, true);
        if (is_array($decoded) && ! empty($decoded['qr_code_value'])) {
            return (string) $decoded['qr_code_value'];
        }

        return $trimmed;
    }

    protected function generateUniqueValue(): string
    {
        do {
            $value = 'SW-'.strtoupper(Str::random(12));
        } while (QrCode::where('qr_code_value', $value)->exists());

        return $value;
    }
}

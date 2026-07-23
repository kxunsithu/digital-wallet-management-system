<?php

namespace App\Traits;

trait NormalizesPhoneNumber
{
    /**
     * Normalize any Myanmar phone number to local 09xxxxxxxx format.
     * Accepts: 09xxxxxxxx | 959xxxxxxxx | +959xxxxxxxx
     */
    protected function normalizePhone(string $phone): string
    {
        // Strip everything except digits and plus sign
        $phone = preg_replace('/[^\d+]/', '', $phone);

        // +959xxxxxxxx → 09xxxxxxxx
        if (str_starts_with($phone, '+959')) {
            return '09' . substr($phone, 4);
        }

        // 959xxxxxxxx → 09xxxxxxxx
        if (str_starts_with($phone, '959')) {
            return '09' . substr($phone, 3);
        }

        // Already 09xxxxxxxx
        if (str_starts_with($phone, '09')) {
            return $phone;
        }

        // If it starts with 9 directly, prepend 0 to make it 09xxxxxxxx
        if (str_starts_with($phone, '9')) {
            return '0' . $phone;
        }

        return $phone;
    }

    /**
     * Convert local 09xxxxxxxx to international +959xxxxxxxx for SMS delivery only.
     */
    protected function phoneToInternational(string $phone): string
    {
        $local = $this->normalizePhone($phone);

        if (str_starts_with($local, '09')) {
            return '+959' . substr($local, 2);
        }

        return $local;
    }
}

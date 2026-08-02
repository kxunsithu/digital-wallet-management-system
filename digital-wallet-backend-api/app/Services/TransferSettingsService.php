<?php

namespace App\Services;

use App\Models\TransferSetting;

class TransferSettingsService
{
    public function get(): TransferSetting
    {
        return TransferSetting::firstOrCreate(
            ['id' => 1],
            [
                'unverified_customer_transfer_limit' => 100000,
                'customer_transfer_fee_percent' => 0.5,
            ]
        );
    }

    public function update(array $data): TransferSetting
    {
        $settings = $this->get();
        $settings->update($data);

        return $settings->fresh();
    }
}

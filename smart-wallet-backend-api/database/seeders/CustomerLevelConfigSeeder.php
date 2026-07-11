<?php

namespace Database\Seeders;

use App\Models\CustomerLevelConfig;
use Illuminate\Database\Seeder;

class CustomerLevelConfigSeeder extends Seeder
{
    public function run(): void
    {
        $levels = [
            [
                'level' => 'basic',
                'daily_transfer_limit' => 1000000,
                'monthly_transfer_limit' => 10000000,
                'max_wallet_balance' => 5000000,
                'daily_cash_out_limit' => 500000,
                'max_transaction_count_daily' => 20,
                'can_use_qr_payment' => false,
                'can_receive_from_agent' => true,
                'requires_kyc' => false,
                'is_active' => true,
            ],
            [
                'level' => 'silver',
                'daily_transfer_limit' => 3000000,
                'monthly_transfer_limit' => 30000000,
                'max_wallet_balance' => 10000000,
                'daily_cash_out_limit' => 1000000,
                'max_transaction_count_daily' => 30,
                'can_use_qr_payment' => true,
                'can_receive_from_agent' => true,
                'requires_kyc' => false,
                'is_active' => true,
            ],
            [
                'level' => 'gold',
                'daily_transfer_limit' => 5000000,
                'monthly_transfer_limit' => 50000000,
                'max_wallet_balance' => 20000000,
                'daily_cash_out_limit' => 2000000,
                'max_transaction_count_daily' => 50,
                'can_use_qr_payment' => true,
                'can_receive_from_agent' => true,
                'requires_kyc' => true,
                'is_active' => true,
            ],
            [
                'level' => 'platinum',
                'daily_transfer_limit' => 10000000,
                'monthly_transfer_limit' => 100000000,
                'max_wallet_balance' => 50000000,
                'daily_cash_out_limit' => 5000000,
                'max_transaction_count_daily' => 100,
                'can_use_qr_payment' => true,
                'can_receive_from_agent' => true,
                'requires_kyc' => true,
                'is_active' => true,
            ],
        ];

        foreach ($levels as $level) {
            CustomerLevelConfig::updateOrCreate(['level' => $level['level']], $level);
        }
    }
}

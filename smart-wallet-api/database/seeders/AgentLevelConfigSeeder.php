<?php

namespace Database\Seeders;

use App\Models\AgentLevelConfig;
use Illuminate\Database\Seeder;

class AgentLevelConfigSeeder extends Seeder
{
    public function run(): void
    {
        $levels = [
            [
                'level' => 'level_1',
                'daily_cash_limit' => 5000000.00,
                'default_commission_rate' => 0.50,
                'min_float_required' => 500000.00,
                'can_recruit_sub_agent' => false,
                'is_active' => true,
            ],
            [
                'level' => 'level_2',
                'daily_cash_limit' => 15000000.00,
                'default_commission_rate' => 0.75,
                'min_float_required' => 1000000.00,
                'can_recruit_sub_agent' => false,
                'is_active' => true,
            ],
            [
                'level' => 'level_3',
                'daily_cash_limit' => 50000000.00,
                'default_commission_rate' => 1.00,
                'min_float_required' => 5000000.00,
                'can_recruit_sub_agent' => true,
                'is_active' => true,
            ],
            [
                'level' => 'master',
                'daily_cash_limit' => 200000000.00,
                'default_commission_rate' => 1.50,
                'min_float_required' => 20000000.00,
                'can_recruit_sub_agent' => true,
                'is_active' => true,
            ],
        ];

        foreach ($levels as $level) {
            AgentLevelConfig::firstOrCreate(['level' => $level['level']], $level);
        }
    }
}

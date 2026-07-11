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
                'level' => 'starter',
                'daily_cash_limit' => 1000000,
                'default_commission_rate' => 2.5,
                'min_float_required' => 500000,
                'can_recruit_sub_agent' => false,
                'is_active' => true,
            ],
            [
                'level' => 'growth',
                'daily_cash_limit' => 3000000,
                'default_commission_rate' => 3.5,
                'min_float_required' => 1000000,
                'can_recruit_sub_agent' => true,
                'is_active' => true,
            ],
            [
                'level' => 'advanced',
                'daily_cash_limit' => 5000000,
                'default_commission_rate' => 5.0,
                'min_float_required' => 2000000,
                'can_recruit_sub_agent' => true,
                'is_active' => true,
            ],
            [
                'level' => 'elite',
                'daily_cash_limit' => 10000000,
                'default_commission_rate' => 7.5,
                'min_float_required' => 5000000,
                'can_recruit_sub_agent' => true,
                'is_active' => true,
            ],
        ];

        foreach ($levels as $level) {
            AgentLevelConfig::updateOrCreate(['level' => $level['level']], $level);
        }
    }
}

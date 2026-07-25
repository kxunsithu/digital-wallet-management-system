<?php

namespace Database\Seeders;

use App\Models\AgentManagerProfile;
use App\Models\AgentProfile;
use App\Models\StateRegion;
use App\Models\Township;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class AgentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $role = DB::table('roles')->where('name', 'agent')->first();
        if (! $role) {
            return;
        }

        $agentsData = [
            [
                'full_name' => 'Aung Ko Ko',
                'phone_number' => '09944075001',
                'nrc_number' => '12/KAMAYU(N)283746',
                'agent_code' => 'agt_aungkk',
                'shop_name' => 'Aung Mobile Shop',
                'shop_address' => 'No. 45, Pyay Road, Kamayut',
                'region_name' => 'Yangon Region',
                'township_name' => 'Kamayut',
                'manager_code' => 'mgr_minthant',
                'status' => 'active',
                'float_balance' => 1500000.00,
                'total_volume_monthly' => 3200000.00,
            ],
            [
                'full_name' => 'Su Mon',
                'phone_number' => '09944075002',
                'nrc_number' => '12/BAHAN(N)374829',
                'agent_code' => 'agt_sumon',
                'shop_name' => 'Su Mon Telecom',
                'shop_address' => 'No. 12, University Avenue, Bahan',
                'region_name' => 'Yangon Region',
                'township_name' => 'Bahan',
                'manager_code' => 'mgr_zayarl',
                'status' => 'active',
                'float_balance' => 800000.00,
                'total_volume_monthly' => 950000.00,
            ],
            [
                'full_name' => 'Myo Min',
                'phone_number' => '09944075003',
                'nrc_number' => '9/MAHA(N)293847',
                'agent_code' => 'agt_myomin',
                'shop_name' => 'Myo Min Cash Point',
                'shop_address' => '78th Street, Mahar Aung Myay',
                'region_name' => 'Mandalay Region',
                'township_name' => 'Mahar Aung Myay',
                'manager_code' => 'mgr_thiris',
                'status' => 'active',
                'float_balance' => 2500000.00,
                'total_volume_monthly' => 5100000.00,
            ],
            [
                'full_name' => 'Phyo Wai',
                'phone_number' => '09944075004',
                'nrc_number' => '13/TAUNG(N)384756',
                'agent_code' => 'agt_phyowai',
                'shop_name' => 'Phyo Wai Wallet Center',
                'shop_address' => 'Bogyoke Road, Taunggyi',
                'region_name' => 'Shan State',
                'township_name' => 'Taunggyi',
                'manager_code' => 'mgr_nankl',
                'status' => 'pending',
                'float_balance' => 500000.00,
                'total_volume_monthly' => 0.00,
            ],
            [
                'full_name' => 'Nyein Chan',
                'phone_number' => '09944075005',
                'nrc_number' => '8/MABANA(N)475829',
                'agent_code' => 'agt_nyeinc',
                'shop_name' => 'Nyein Chan Agent Shop',
                'shop_address' => 'Strand Road, Pyay',
                'region_name' => 'Bago Region',
                'township_name' => 'Pyay',
                'manager_code' => 'mgr_hlahla',
                'status' => 'inactive',
                'float_balance' => 300000.00,
                'total_volume_monthly' => 420000.00,
            ],
            [
                'full_name' => 'Htet Aung',
                'phone_number' => '09944075006',
                'nrc_number' => '12/HLAING(N)586739',
                'agent_code' => 'agt_hteta',
                'shop_name' => 'Htet Aung Digital Services',
                'shop_address' => 'No. 88, Hledan Road, Hlaing',
                'region_name' => 'Yangon Region',
                'township_name' => 'Hlaing',
                'manager_code' => 'mgr_minthant',
                'status' => 'active',
                'float_balance' => 5000000.00,
                'total_volume_monthly' => 8900000.00,
                'custom_commission_override' => 6.5,
                'parent_agent_code' => 'agt_aungkk',
            ],
        ];

        foreach ($agentsData as $data) {
            $region = StateRegion::where('name', $data['region_name'])->first();
            $township = Township::where('name', $data['township_name'])->first();

            $managerProfile = AgentManagerProfile::where('manager_code', $data['manager_code'])->first();

            $user = User::updateOrCreate(
                ['phone_number' => $data['phone_number']],
                [
                    'role_id' => $role->id,
                    'full_name' => $data['full_name'],
                    'nrc_number' => $data['nrc_number'],
                    'status' => $data['status'],
                    'is_phone_verified' => true,
                    'is_pin_created' => true,
                ]
            );

            $parentAgentId = null;
            if (! empty($data['parent_agent_code'])) {
                $parentAgentId = AgentProfile::where('agent_code', $data['parent_agent_code'])->value('id');
            }

            AgentProfile::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'agent_code' => $data['agent_code'],
                    'shop_name' => $data['shop_name'],
                    'shop_address' => $data['shop_address'],
                    'state_region_id' => $region?->id,
                    'township_id' => $township?->id,
                    'created_by_manager_id' => $managerProfile?->user_id,
                    'parent_agent_id' => $parentAgentId,
                ]
            );
        }
    }
}

<?php

namespace Database\Seeders;

use App\Models\AgentManagerProfile;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AgentManagerSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $role = DB::table('roles')->where('name', 'agent_manager')->first();
        if (!$role) {
            return;
        }

        $managersData = [
            [
                'full_name' => 'Min Thant',
                'phone_number' => '09944074981',
                'nrc_number' => '12/KAMAYU(N)182736',
                'state_region' => 'Yangon Region',
                'township' => 'Kamayut',
                'manager_code' => 'mgr_minthant',
                'status' => 'active',
            ],
            [
                'full_name' => 'Zayar Lynn',
                'phone_number' => '09944074982',
                'nrc_number' => '12/Bahan(N)192837',
                'state_region' => 'Yangon Region',
                'township' => 'Bahan',
                'manager_code' => 'mgr_zayarl',
                'status' => 'active',
            ],
            [
                'full_name' => 'Thiri Swe',
                'phone_number' => '09944074983',
                'nrc_number' => '9/MAHA(N)102938',
                'state_region' => 'Mandalay Region',
                'township' => 'Mahar Aung Myay',
                'manager_code' => 'mgr_thiris',
                'status' => 'active',
            ],
            [
                'full_name' => 'Kyaw Zin Win',
                'phone_number' => '09944074984',
                'nrc_number' => '14/PATHE(N)120394',
                'state_region' => 'Ayeyarwady Region',
                'township' => 'Pathein',
                'manager_code' => 'mgr_kyawzw',
                'status' => 'pending',
            ],
            [
                'full_name' => 'Nan Khin Lay',
                'phone_number' => '09944074985',
                'nrc_number' => '13/TAUNG(N)148293',
                'state_region' => 'Shan State',
                'township' => 'Taunggyi',
                'manager_code' => 'mgr_nankl',
                'status' => 'active',
            ],
            [
                'full_name' => 'Hla Hla Win',
                'phone_number' => '09944074986',
                'nrc_number' => '8/MABANA(N)123456',
                'state_region' => 'Bago Region',
                'township' => 'Pyay',
                'manager_code' => 'mgr_hlahla',
                'status' => 'inactive',
            ],
        ];

        foreach ($managersData as $data) {
            // Create or update user
            $user = User::updateOrCreate(
                ['phone_number' => $data['phone_number']],
                [
                    'role_id' => $role->id,
                    'full_name' => $data['full_name'],
                    'nrc_number' => $data['nrc_number'],
                    'state_region' => $data['state_region'],
                    'township' => $data['township'],
                    'status' => $data['status'],
                    'is_phone_verified' => true,
                    'is_pin_created' => true,
                ]
            );

            // Create or update profile
            AgentManagerProfile::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'manager_code' => $data['manager_code'],
                ]
            );
        }
    }
}

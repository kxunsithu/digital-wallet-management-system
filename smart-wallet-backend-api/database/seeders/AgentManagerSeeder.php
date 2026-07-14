<?php

namespace Database\Seeders;

use App\Models\AgentManagerProfile;
use App\Models\StateRegion;
use App\Models\Township;
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
                'email' => 'minthant@gmail.com',
                'nrc_number' => '12/KAMAYU(N)182736',
                'manager_code' => 'mgr_minthant',
                'region_name' => 'Yangon Region',
                'township_name' => 'Kamayut',
                'status' => 'active',
                'approval_limit' => 10000000.00
            ],
            [
                'full_name' => 'Zayar Lynn',
                'phone_number' => '09944074982',
                'email' => 'zayarlynn@gmail.com',
                'nrc_number' => '12/Bahan(N)192837',
                'manager_code' => 'mgr_zayarl',
                'region_name' => 'Yangon Region',
                'township_name' => 'Bahan',
                'status' => 'active',
                'approval_limit' => 8000000.00
            ],
            [
                'full_name' => 'Thiri Swe',
                'phone_number' => '09944074983',
                'email' => 'thiriswe@gmail.com',
                'nrc_number' => '9/MAHA(N)102938',
                'manager_code' => 'mgr_thiris',
                'region_name' => 'Mandalay Region',
                'township_name' => 'Mahar Aung Myay',
                'status' => 'active',
                'approval_limit' => 12000000.00
            ],
            [
                'full_name' => 'Kyaw Zin Win',
                'phone_number' => '09944074984',
                'email' => 'kyawzinwin@gmail.com',
                'nrc_number' => '14/PATHE(N)120394',
                'manager_code' => 'mgr_kyawzw',
                'region_name' => 'Ayeyarwady Region',
                'township_name' => 'Pathein',
                'status' => 'pending',
                'approval_limit' => 5000000.00
            ],
            [
                'full_name' => 'Nan Khin Lay',
                'phone_number' => '09944074985',
                'email' => 'nankhinlay@gmail.com',
                'nrc_number' => '13/TAUNG(N)148293',
                'manager_code' => 'mgr_nankl',
                'region_name' => 'Shan State',
                'township_name' => 'Taunggyi',
                'status' => 'active',
                'approval_limit' => 9000000.00
            ],
            [
                'full_name' => 'Hla Hla Win',
                'phone_number' => '09944074986',
                'email' => 'hlahlawin@gmail.com',
                'nrc_number' => '8/MABANA(N)123456',
                'manager_code' => 'mgr_hlahla',
                'region_name' => 'Bago Region',
                'township_name' => 'Pyay',
                'status' => 'inactive',
                'approval_limit' => 3000000.00
            ],
        ];

        foreach ($managersData as $data) {
            $region = StateRegion::where('name', $data['region_name'])->first();
            $township = Township::where('name', $data['township_name'])->first();

            // Create or update user
            $user = User::updateOrCreate(
                ['phone_number' => $data['phone_number']],
                [
                    'role_id' => $role->id,
                    'full_name' => $data['full_name'],
                    'email' => $data['email'],
                    'nrc_number' => $data['nrc_number'],
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
                    'state_region_id' => $region ? $region->id : null,
                    'township_id' => $township ? $township->id : null,
                    'approval_limit' => $data['approval_limit']
                ]
            );
        }
    }
}

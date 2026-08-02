<?php

namespace Database\Seeders;

use App\Models\CustomerProfile;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CustomerSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $role = DB::table('roles')->where('name', 'customer')->first();
        if (! $role) {
            return;
        }

        $customersData = [
            [
                'full_name' => 'May Thu',
                'phone_number' => '09944076001',
                'nrc_number' => '12/KAMAYU(N)384756',
                'state_region' => 'Yangon Region',
                'township' => 'Kamayut',
                'referral_code' => 'ref_maythu',
                'kyc_status' => 'verified',
                'custom_limit_override' => null,
            ],
            [
                'full_name' => 'Zin Mar Oo',
                'phone_number' => '09944076002',
                'nrc_number' => '12/BAHAN(N)475829',
                'state_region' => 'Yangon Region',
                'township' => 'Bahan',
                'referral_code' => 'ref_zinmar',
                'kyc_status' => 'verified',
                'referrer_phone' => '09944076001',
            ],
            [
                'full_name' => 'Kaung Htet',
                'phone_number' => '09944076003',
                'nrc_number' => '9/MAHA(N)586739',
                'state_region' => 'Mandalay Region',
                'township' => 'Mahar Aung Myay',
                'referral_code' => 'ref_kaungh',
                'kyc_status' => 'pending',
            ],
            [
                'full_name' => 'Ei Mon',
                'phone_number' => '09944076004',
                'nrc_number' => '13/TAUNG(N)697840',
                'state_region' => 'Shan State',
                'township' => 'Taunggyi',
                'referral_code' => 'ref_eimon',
                'kyc_status' => 'approved',
                'referrer_phone' => '09944076001',
            ],
            [
                'full_name' => 'Soe Paing',
                'phone_number' => '09944076005',
                'nrc_number' => '8/MABANA(N)708951',
                'state_region' => 'Bago Region',
                'township' => 'Pyay',
                'referral_code' => 'ref_soepa',
                'kyc_status' => 'rejected',
            ],
            [
                'full_name' => 'Hnin Wai',
                'phone_number' => '09944076006',
                'nrc_number' => '12/HLAING(N)819062',
                'state_region' => 'Yangon Region',
                'township' => 'Hlaing',
                'referral_code' => 'ref_hninw',
                'kyc_status' => 'verified',
                'custom_limit_override' => 15000000.00,
                'referrer_phone' => '09944076002',
            ],
        ];

        foreach ($customersData as $data) {
            $referrerId = null;
            if (! empty($data['referrer_phone'])) {
                $referrerId = User::where('phone_number', $data['referrer_phone'])->value('id');
            }

            $user = User::updateOrCreate(
                ['phone_number' => $data['phone_number']],
                [
                    'role_id' => $role->id,
                    'full_name' => $data['full_name'],
                    'nrc_number' => $data['nrc_number'],
                    'state_region' => $data['state_region'],
                    'township' => $data['township'],
                    'status' => in_array($data['kyc_status'], ['verified', 'approved'], true) ? 'active' : 'inactive',
                    'is_phone_verified' => true,
                    'is_pin_created' => true,
                ]
            );

            CustomerProfile::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'kyc_status' => $data['kyc_status'],
                    'referral_code' => $data['referral_code'],
                    'referred_by' => $referrerId,
                    'custom_limit_override' => $data['custom_limit_override'] ?? null,
                ]
            );
        }
    }
}

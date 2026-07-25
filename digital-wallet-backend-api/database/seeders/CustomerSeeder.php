<?php

namespace Database\Seeders;

use App\Models\CustomerProfile;
use App\Models\StateRegion;
use App\Models\Township;
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
                'referral_code' => 'ref_maythu',
                'region_name' => 'Yangon Region',
                'township_name' => 'Kamayut',
                'kyc_status' => 'verified',
                'custom_limit_override' => null,
            ],
            [
                'full_name' => 'Zin Mar Oo',
                'phone_number' => '09944076002',
                'nrc_number' => '12/BAHAN(N)475829',
                'referral_code' => 'ref_zinmar',
                'region_name' => 'Yangon Region',
                'township_name' => 'Bahan',
                'kyc_status' => 'verified',
                'referrer_phone' => '09944076001',
            ],
            [
                'full_name' => 'Kaung Htet',
                'phone_number' => '09944076003',
                'nrc_number' => '9/MAHA(N)586739',
                'referral_code' => 'ref_kaungh',
                'region_name' => 'Mandalay Region',
                'township_name' => 'Mahar Aung Myay',
                'kyc_status' => 'pending',
            ],
            [
                'full_name' => 'Ei Mon',
                'phone_number' => '09944076004',
                'nrc_number' => '13/TAUNG(N)697840',
                'referral_code' => 'ref_eimon',
                'region_name' => 'Shan State',
                'township_name' => 'Taunggyi',
                'kyc_status' => 'approved',
                'referrer_phone' => '09944076001',
            ],
            [
                'full_name' => 'Soe Paing',
                'phone_number' => '09944076005',
                'nrc_number' => '8/MABANA(N)708951',
                'referral_code' => 'ref_soepa',
                'region_name' => 'Bago Region',
                'township_name' => 'Pyay',
                'kyc_status' => 'rejected',
            ],
            [
                'full_name' => 'Hnin Wai',
                'phone_number' => '09944076006',
                'nrc_number' => '12/HLAING(N)819062',
                'referral_code' => 'ref_hninw',
                'region_name' => 'Yangon Region',
                'township_name' => 'Hlaing',
                'kyc_status' => 'verified',
                'custom_limit_override' => 15000000.00,
                'referrer_phone' => '09944076002',
            ],
        ];

        foreach ($customersData as $data) {
            $region = StateRegion::where('name', $data['region_name'])->first();
            $township = Township::where('name', $data['township_name'])->first();

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
                    'state_region_id' => $region?->id,
                    'township_id' => $township?->id,
                    'custom_limit_override' => $data['custom_limit_override'] ?? null,
                ]
            );
        }
    }
}

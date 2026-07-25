<?php

namespace Database\Seeders;

use App\Models\StateRegion;
use App\Models\Township;
use Illuminate\Database\Seeder;

class MyanmarLocationsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $locations = [
            'Yangon Region' => [
                'Kamayut',
                'Bahan',
                'Hlaing',
                'Latha',
                'Dagon',
                'Sanchaung',
                'Kyauktada',
                'Lanmadaw',
                'Botataung',
                'Pazundaung'
            ],
            'Mandalay Region' => [
                'Chanayethazan',
                'Mahar Aung Myay',
                'Pyigyidagun',
                'Aungmyethazan',
                'Chanmyathazi',
                'Patheingyi'
            ],
            'Naypyidaw Union Territory' => [
                'Zabuthiri',
                'Zeyarthiri',
                'Ottarathiri',
                'Dekkhinathiri',
                'Pyinmana',
                'Lewe'
            ],
            'Shan State' => [
                'Taunggyi',
                'Lashio',
                'Kyaingtong',
                'Kalaw',
                'Muse'
            ],
            'Bago Region' => [
                'Bago',
                'Pyay',
                'Taungoo'
            ],
            'Kayin State' => [
                'Hpa-an',
                'Myawaddy',
                'Kawkareik'
            ],
            'Mon State' => [
                'Mawlamyine',
                'Mudon',
                'Thaton'
            ]
        ];

        foreach ($locations as $regionName => $townships) {
            $region = StateRegion::updateOrCreate(
                ['name' => $regionName]
            );

            foreach ($townships as $townshipName) {
                Township::updateOrCreate(
                    [
                        'state_region_id' => $region->id,
                        'name' => $townshipName
                    ]
                );
            }
        }
    }
}

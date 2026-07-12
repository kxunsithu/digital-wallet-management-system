<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RolesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $roles = config('roles.list', []);

        foreach ($roles as $key => $role) {
            DB::table('roles')->updateOrInsert(
                ['name' => $role['name'] ?? $key],
                [
                    'description' => $role['description'] ?? null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        }
    }
}

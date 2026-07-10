<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            [
                'name' => 'admin',
                'description' => 'System administrator with full access',
            ],
            [
                'name' => 'agent',
                'description' => 'Cash-in/cash-out agent',
            ],
            [
                'name' => 'customer',
                'description' => 'Regular wallet user',
            ],
        ];

        foreach ($roles as $role) {
            Role::firstOrCreate(['name' => $role['name']], $role);
        }
    }
}

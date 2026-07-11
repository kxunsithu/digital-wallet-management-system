<?php

namespace Tests\Feature;

use App\Models\Role;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AgentManagerRoleTest extends TestCase
{
    use RefreshDatabase;

    public function test_agent_manager_role_is_seeded(): void
    {
        $this->seed(RoleSeeder::class);

        $this->assertTrue(Role::where('name', 'agent_manager')->exists());
    }
}

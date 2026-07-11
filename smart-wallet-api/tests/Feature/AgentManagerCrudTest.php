<?php

namespace Tests\Feature;

use App\Models\AgentManagerProfile;
use App\Models\AgentProfile;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AgentManagerCrudTest extends TestCase
{
    use RefreshDatabase;

    public function test_agent_manager_can_create_list_update_and_delete_their_agents(): void
    {
        $this->seed(RoleSeeder::class);

        $managerRole = Role::where('name', 'agent_manager')->firstOrFail();
        $agentRole = Role::where('name', 'agent')->firstOrFail();

        $manager = User::create([
            'phone_number' => '+959111111111',
            'role_id' => $managerRole->id,
            'full_name' => 'Manager One',
            'status' => 'active',
            'is_phone_verified' => true,
            'is_pin_created' => true,
        ]);

        AgentManagerProfile::create([
            'user_id' => $manager->id,
            'manager_code' => 'AM-001',
            'status' => 'active',
            'approval_limit' => 1000000,
        ]);

        Sanctum::actingAs($manager, ['*']);

        $createResponse = $this->postJson('/api/agent-manager/agents', [
            'phone_number' => '+959222222222',
            'full_name' => 'Agent One',
            'agent_code' => 'AG-001',
            'level' => 'level_1',
            'shop_name' => 'Shop One',
            'township' => 'Yangon',
        ]);

        $createResponse->assertCreated();

        $agent = User::where('phone_number', '+959222222222')->firstOrFail();

        $listResponse = $this->getJson('/api/agent-manager/agents');
        $listResponse->assertOk()
            ->assertJsonCount(1, 'data');

        $updateResponse = $this->patchJson('/api/agent-manager/agents/' . $agent->id, [
            'full_name' => 'Agent One Updated',
            'shop_name' => 'Shop Updated',
        ]);

        $updateResponse->assertOk();
        $this->assertSame('Agent One Updated', $agent->fresh()->full_name);

        $deleteResponse = $this->deleteJson('/api/agent-manager/agents/' . $agent->id);
        $deleteResponse->assertOk();
        $this->assertNull(User::find($agent->id));
    }
}

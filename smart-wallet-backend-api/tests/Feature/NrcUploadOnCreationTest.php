<?php

namespace Tests\Feature;

use App\Models\NrcVerification;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class NrcUploadOnCreationTest extends TestCase
{
    use RefreshDatabase;

    public function test_agent_manager_creation_stores_nrc_verification(): void
    {
        DB::table('roles')->insert([
            'id' => 1,
            'name' => 'admin',
            'description' => 'Administrator',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $admin = User::create([
            'phone_number' => '09111111111',
            'role_id' => 1,
            'status' => 'active',
        ]);

        $response = $this->actingAs($admin, 'sanctum')->postJson('/api/agent-managers', [
            'user_id' => $admin->id,
            'manager_code' => 'MGR-001',
            'region' => 'Yangon',
            'township' => 'Mayangone',
            'status' => 'pending',
            'approval_limit' => 5000000,
            'nrc_front_image_path' => '/uploads/nrc/front.jpg',
            'nrc_back_image_path' => '/uploads/nrc/back.jpg',
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('nrc_verifications', [
            'user_id' => $admin->id,
            'status' => 'pending',
            'nrc_front_image_path' => '/uploads/nrc/front.jpg',
            'nrc_back_image_path' => '/uploads/nrc/back.jpg',
        ]);
    }

    public function test_agent_creation_stores_nrc_verification(): void
    {
        DB::table('roles')->insert([
            'id' => 2,
            'name' => 'agent_manager',
            'description' => 'Agent Manager',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $manager = User::create([
            'phone_number' => '09122222222',
            'role_id' => 2,
            'status' => 'active',
        ]);

        DB::table('agent_manager_profiles')->insert([
            'user_id' => $manager->id,
            'manager_code' => 'MGR-002',
            'region' => 'Yangon',
            'township' => 'Mayangone',
            'status' => 'active',
            'approval_limit' => 1000000,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $response = $this->actingAs($manager, 'sanctum')->postJson('/api/agents', [
            'user_id' => $manager->id,
            'agent_code' => 'AGT-001',
            'level' => 'starter',
            'shop_name' => 'Test Shop',
            'shop_address' => 'Main Street',
            'township' => 'Mayangone',
            'status' => 'pending',
            'nrc_front_image_path' => '/uploads/nrc/front-agent.jpg',
            'nrc_back_image_path' => '/uploads/nrc/back-agent.jpg',
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('nrc_verifications', [
            'user_id' => $manager->id,
            'status' => 'pending',
            'nrc_front_image_path' => '/uploads/nrc/front-agent.jpg',
            'nrc_back_image_path' => '/uploads/nrc/back-agent.jpg',
        ]);
    }
}

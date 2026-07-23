<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
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

        $stateRegionId = DB::table('state_regions')->insertGetId([
            'name' => 'Yangon',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $townshipId = DB::table('townships')->insertGetId([
            'state_region_id' => $stateRegionId,
            'name' => 'Mayangone',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $admin = User::create([
            'phone_number' => '09111111111',
            'role_id' => 1,
            'status' => 'active',
        ]);

        $response = $this->actingAs($admin, 'sanctum')->postJson('/api/agent-managers', [
            'phone_number' => '09200000001',
            'full_name' => 'Agent Manager User',
            'nrc_number' => '12/ABCDE(N)123456',
            'state_region_id' => $stateRegionId,
            'township_id' => $townshipId,
            'status' => 'pending',
            'nrc_front_image' => UploadedFile::fake()->create('front.jpg', 100, 'image/jpeg'),
            'nrc_back_image' => UploadedFile::fake()->create('back.jpg', 100, 'image/jpeg'),
        ]);

        $response->assertStatus(201);

        $createdUserId = DB::table('users')->where('phone_number', '09200000001')->value('id');

        $this->assertDatabaseHas('images', [
            'user_id' => $createdUserId,
            'image_type' => 'nrc_front_image',
        ]);
        $this->assertDatabaseHas('images', [
            'user_id' => $createdUserId,
            'image_type' => 'nrc_back_image',
        ]);

        $this->assertDatabaseHas('nrc_verifications', [
            'user_id' => $createdUserId,
            'status' => 'verified',
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

        $stateRegionId = DB::table('state_regions')->insertGetId([
            'name' => 'Yangon',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $townshipId = DB::table('townships')->insertGetId([
            'state_region_id' => $stateRegionId,
            'name' => 'Mayangone',
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
            'state_region_id' => $stateRegionId,
            'township_id' => $townshipId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $response = $this->actingAs($manager, 'sanctum')->postJson('/api/agents', [
            'phone_number' => '09200000002',
            'full_name' => 'Agent User',
            'nrc_number' => '13/ABCDE(N)123457',
            'shop_name' => 'Test Shop',
            'shop_address' => 'Main Street',
            'state_region_id' => $stateRegionId,
            'township_id' => $townshipId,
            'status' => 'pending',
            'nrc_front_image' => UploadedFile::fake()->create('front-agent.jpg', 100, 'image/jpeg'),
            'nrc_back_image' => UploadedFile::fake()->create('back-agent.jpg', 100, 'image/jpeg'),
        ]);

        $response->assertStatus(201);

        $createdUserId = DB::table('users')->where('phone_number', '09200000002')->value('id');

        $this->assertDatabaseHas('images', [
            'user_id' => $createdUserId,
            'image_type' => 'nrc_front_image',
        ]);
        $this->assertDatabaseHas('images', [
            'user_id' => $createdUserId,
            'image_type' => 'nrc_back_image',
        ]);

        $this->assertDatabaseHas('nrc_verifications', [
            'user_id' => $createdUserId,
            'status' => 'verified',
        ]);
    }

    public function test_agent_manager_cannot_update_agent_nrc(): void
    {
        DB::table('roles')->insert([
            ['id' => 1, 'name' => 'admin', 'description' => 'Admin', 'created_at' => now(), 'updated_at' => now()],
            ['id' => 2, 'name' => 'agent_manager', 'description' => 'Agent Manager', 'created_at' => now(), 'updated_at' => now()],
            ['id' => 3, 'name' => 'agent', 'description' => 'Agent', 'created_at' => now(), 'updated_at' => now()],
        ]);

        $manager = User::create([
            'phone_number' => '09122222222',
            'role_id' => 2,
            'status' => 'active',
        ]);

        DB::table('agent_manager_profiles')->insert([
            'user_id' => $manager->id,
            'manager_code' => 'MGR-002',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $agentUser = User::create([
            'phone_number' => '09200000002',
            'full_name' => 'Original Agent Name',
            'nrc_number' => '13/ABCDE(N)123457',
            'role_id' => 3,
            'status' => 'active',
        ]);

        $agentProfile = \App\Models\AgentProfile::create([
            'user_id' => $agentUser->id,
            'agent_code' => 'AGT-001',
            'created_by_manager_id' => $manager->id,
        ]);

        // Attempt update as manager
        $response = $this->actingAs($manager, 'sanctum')->putJson("/api/agents/{$agentProfile->id}", [
            'full_name' => 'Updated Agent Name',
            'nrc_number' => '14/ABCDE(N)999999', // should be ignored
        ]);

        $response->assertStatus(200);

        // Verify full_name updated, but nrc_number did not change
        $agentUser->refresh();
        $this->assertEquals('Updated Agent Name', $agentUser->full_name);
        $this->assertEquals('13/ABCDE(N)123457', $agentUser->nrc_number);
    }

    public function test_admin_cannot_update_agent(): void
    {
        DB::table('roles')->insert([
            ['id' => 1, 'name' => 'admin', 'description' => 'Admin', 'created_at' => now(), 'updated_at' => now()],
            ['id' => 2, 'name' => 'agent_manager', 'description' => 'Agent Manager', 'created_at' => now(), 'updated_at' => now()],
            ['id' => 3, 'name' => 'agent', 'description' => 'Agent', 'created_at' => now(), 'updated_at' => now()],
        ]);

        $admin = User::create([
            'phone_number' => '09111111111',
            'role_id' => 1,
            'status' => 'active',
        ]);

        $manager = User::create([
            'phone_number' => '09122222222',
            'role_id' => 2,
            'status' => 'active',
        ]);

        $agentUser = User::create([
            'phone_number' => '09200000002',
            'full_name' => 'Original Agent Name',
            'nrc_number' => '13/ABCDE(N)123457',
            'role_id' => 3,
            'status' => 'active',
        ]);

        $agentProfile = \App\Models\AgentProfile::create([
            'user_id' => $agentUser->id,
            'agent_code' => 'AGT-001',
            'created_by_manager_id' => $manager->id,
        ]);

        // Attempt update as admin -> should be forbidden (403)
        $response = $this->actingAs($admin, 'sanctum')->putJson("/api/agents/{$agentProfile->id}", [
            'full_name' => 'Updated Agent Name',
        ]);

        $response->assertStatus(403);
    }

    public function test_toggle_nrc_status(): void
    {
        DB::table('roles')->insert([
            ['id' => 1, 'name' => 'admin', 'description' => 'Admin', 'created_at' => now(), 'updated_at' => now()],
            ['id' => 2, 'name' => 'agent_manager', 'description' => 'Agent Manager', 'created_at' => now(), 'updated_at' => now()],
            ['id' => 3, 'name' => 'agent', 'description' => 'Agent', 'created_at' => now(), 'updated_at' => now()],
        ]);

        $manager = User::create([
            'phone_number' => '09122222222',
            'role_id' => 2,
            'status' => 'active',
        ]);

        DB::table('agent_manager_profiles')->insert([
            'user_id' => $manager->id,
            'manager_code' => 'MGR-002',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $agentUser = User::create([
            'phone_number' => '09200000002',
            'full_name' => 'Agent Name',
            'nrc_number' => '13/ABCDE(N)123457',
            'role_id' => 3,
            'status' => 'active',
        ]);

        $agentProfile = \App\Models\AgentProfile::create([
            'user_id' => $agentUser->id,
            'agent_code' => 'AGT-001',
            'created_by_manager_id' => $manager->id,
        ]);

        \App\Models\NrcVerification::create([
            'user_id' => $agentUser->id,
            'status' => 'verified',
            'verified_at' => now(),
        ]);

        // Toggle NRC status as manager
        $response = $this->actingAs($manager, 'sanctum')->postJson("/api/agents/{$agentProfile->id}/toggle-nrc-status");

        $response->assertStatus(200)
                 ->assertJsonPath('status', 'rejected');

        $this->assertDatabaseHas('nrc_verifications', [
            'user_id' => $agentUser->id,
            'status' => 'rejected',
        ]);

        // Toggle back to verified
        $response = $this->actingAs($manager, 'sanctum')->postJson("/api/agents/{$agentProfile->id}/toggle-nrc-status");

        $response->assertStatus(200)
                 ->assertJsonPath('status', 'verified');

        $this->assertDatabaseHas('nrc_verifications', [
            'user_id' => $agentUser->id,
            'status' => 'verified',
        ]);
    }
}

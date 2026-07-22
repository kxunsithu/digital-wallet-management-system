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
            'approval_limit' => 5000000,
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
            'approval_limit' => 1000000,
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
    }
}

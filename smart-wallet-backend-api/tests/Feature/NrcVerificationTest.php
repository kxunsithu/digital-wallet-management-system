<?php

namespace Tests\Feature;

use App\Models\CustomerProfile;
use App\Models\NrcVerification;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class NrcVerificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_verify_nrc_and_auto_upgrade_customer_level(): void
    {
        DB::table('roles')->insert([
            'id' => 1,
            'name' => 'admin',
            'description' => 'Administrator',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('roles')->insert([
            'id' => 2,
            'name' => 'customer',
            'description' => 'Customer',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $admin = User::create([
            'phone_number' => '09111111111',
            'role_id' => 1,
            'status' => 'active',
        ]);

        $customer = User::create([
            'phone_number' => '09122222222',
            'role_id' => 2,
            'status' => 'active',
        ]);

        CustomerProfile::create([
            'user_id' => $customer->id,
            'level' => 'basic',
            'kyc_status' => 'pending',
        ]);

        $verification = NrcVerification::create([
            'user_id' => $customer->id,
            'status' => 'pending',
        ]);

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/admin/nrc-verifications/' . $verification->id . '/verify', [
                'status' => 'approved',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.status', 'approved');

        $customer->refresh();
        $profile = $customer->customerProfile()->first();

        $this->assertSame('gold', $profile->level);
        $this->assertSame('verified', $profile->kyc_status);
    }

    public function test_customer_submit_nrc_sets_kyc_status_to_pending(): void
    {
        DB::table('roles')->insert([
            'id' => 1,
            'name' => 'customer',
            'description' => 'Customer',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $customer = User::create([
            'phone_number' => '09144444444',
            'role_id' => 1,
            'status' => 'active',
        ]);

        CustomerProfile::create([
            'user_id' => $customer->id,
            'level' => 'basic',
            'kyc_status' => 'verified',
        ]);

        Storage::fake('public');

        $response = $this->actingAs($customer, 'sanctum')
            ->postJson('/api/customer/nrc-verifications/submit', [
                'nrc_front_image' => UploadedFile::fake()->create('front.jpg', 100, 'image/jpeg'),
                'nrc_back_image' => UploadedFile::fake()->create('back.jpg', 100, 'image/jpeg'),
            ]);

        $response->assertStatus(200)
            ->assertJson(['success' => true, 'message' => 'NRC verification submitted.']);

        $this->assertDatabaseHas('customer_profiles', [
            'user_id' => $customer->id,
            'kyc_status' => 'pending',
        ]);
    }

    public function test_non_admin_cannot_verify_nrc(): void
    {
        DB::table('roles')->insert([
            'id' => 1,
            'name' => 'customer',
            'description' => 'Customer',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $customer = User::create([
            'phone_number' => '09133333333',
            'role_id' => 1,
            'status' => 'active',
        ]);

        $verification = NrcVerification::create([
            'user_id' => $customer->id,
            'status' => 'pending',
        ]);

        $response = $this->actingAs($customer, 'sanctum')
            ->postJson('/api/admin/nrc-verifications/' . $verification->id . '/verify', [
                'status' => 'approved',
            ]);

        $response->assertStatus(403);
    }
}

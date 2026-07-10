<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Role;
use App\Models\CustomerProfile;
use App\Models\NrcVerification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NrcStatusTest extends TestCase
{
    use RefreshDatabase;

    private User $customer;

    protected function setUp(): void
    {
        parent::setUp();

        // Create roles
        Role::create(['name' => 'customer']);
        Role::create(['name' => 'admin']);

        // Create customer user
        $customerRole = Role::where('name', 'customer')->first();
        $this->customer = User::create([
            'phone_number' => '09123456789',
            'role_id' => $customerRole->id,
            'full_name' => 'Test Customer',
            'nrc_number' => '12/ABC(N)123456',
            'status' => 'active',
            'is_phone_verified' => true,
            'is_pin_created' => true,
        ]);

        // Create customer profile
        CustomerProfile::create([
            'user_id' => $this->customer->id,
            'level' => 'basic',
            'kyc_status' => 'pending',
        ]);
    }

    /**
     * Test customer can get NRC status when no NRC exists.
     */
    public function test_customer_can_get_nrc_status_when_no_nrc_exists(): void
    {
        $response = $this->actingAs($this->customer)
            ->getJson('/api/profile/nrc/status');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.has_nrc', false)
            ->assertJsonPath('data.status', null)
            ->assertJsonPath('data.message', 'No NRC verification record found.');
    }

    /**
     * Test customer can get pending NRC status.
     */
    public function test_customer_can_get_pending_nrc_status(): void
    {
        // Create pending NRC
        $nrc = NrcVerification::create([
            'user_id' => $this->customer->id,
            'nrc_front_image_path' => 'nrc/front/test.jpg',
            'nrc_back_image_path' => 'nrc/back/test.jpg',
            'status' => 'pending',
        ]);

        $response = $this->actingAs($this->customer)
            ->getJson('/api/profile/nrc/status');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.has_nrc', true)
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonPath('data.nrc_verification_id', $nrc->id)
            ->assertJsonPath('data.nrc_front_image', 'nrc/front/test.jpg')
            ->assertJsonPath('data.nrc_back_image', 'nrc/back/test.jpg')
            ->assertJsonPath('data.rejection_reason', null)
            ->assertJsonPath('data.verified_at', null);
    }

    /**
     * Test customer can get approved NRC status.
     */
    public function test_customer_can_get_approved_nrc_status(): void
    {
        // Create admin
        $adminRole = Role::where('name', 'admin')->first();
        $admin = User::create([
            'phone_number' => '09987654321',
            'role_id' => $adminRole->id,
            'full_name' => 'Test Admin',
            'status' => 'active',
            'is_phone_verified' => true,
            'is_pin_created' => true,
        ]);

        // Create and approve NRC
        $nrc = NrcVerification::create([
            'user_id' => $this->customer->id,
            'nrc_front_image_path' => 'nrc/front/test.jpg',
            'nrc_back_image_path' => 'nrc/back/test.jpg',
            'status' => 'approved',
            'verified_by' => $admin->id,
            'verified_at' => now(),
        ]);

        $response = $this->actingAs($this->customer)
            ->getJson('/api/profile/nrc/status');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.has_nrc', true)
            ->assertJsonPath('data.status', 'approved')
            ->assertJsonPath('data.nrc_verification_id', $nrc->id);
    }

    /**
     * Test customer can get rejected NRC status with reason.
     */
    public function test_customer_can_get_rejected_nrc_status_with_reason(): void
    {
        // Create admin
        $adminRole = Role::where('name', 'admin')->first();
        $admin = User::create([
            'phone_number' => '09987654321',
            'role_id' => $adminRole->id,
            'full_name' => 'Test Admin',
            'status' => 'active',
            'is_phone_verified' => true,
            'is_pin_created' => true,
        ]);

        $rejectionReason = 'NRC images not clear';

        // Create and reject NRC
        $nrc = NrcVerification::create([
            'user_id' => $this->customer->id,
            'nrc_front_image_path' => 'nrc/front/test.jpg',
            'nrc_back_image_path' => 'nrc/back/test.jpg',
            'status' => 'rejected',
            'rejection_reason' => $rejectionReason,
            'verified_by' => $admin->id,
            'verified_at' => now(),
        ]);

        $response = $this->actingAs($this->customer)
            ->getJson('/api/profile/nrc/status');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.has_nrc', true)
            ->assertJsonPath('data.status', 'rejected')
            ->assertJsonPath('data.rejection_reason', $rejectionReason)
            ->assertJsonPath('data.nrc_verification_id', $nrc->id);
    }

    /**
     * Test customer gets latest NRC when multiple exist.
     */
    public function test_customer_gets_latest_nrc_when_multiple_exist(): void
    {
        // Create old NRC (approved)
        $oldNrc = NrcVerification::create([
            'user_id' => $this->customer->id,
            'nrc_front_image_path' => 'nrc/front/old.jpg',
            'status' => 'approved',
            'created_at' => now()->subDays(5),
        ]);

        // Create newer pending NRC
        $newNrc = NrcVerification::create([
            'user_id' => $this->customer->id,
            'nrc_front_image_path' => 'nrc/front/new.jpg',
            'status' => 'pending',
            'created_at' => now(),
        ]);

        $response = $this->actingAs($this->customer)
            ->getJson('/api/profile/nrc/status');

        // Should return the latest one (pending)
        $response->assertStatus(200)
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonPath('data.nrc_verification_id', $newNrc->id)
            ->assertJsonPath('data.nrc_front_image', 'nrc/front/new.jpg');
    }

    /**
     * Test non-customer cannot get NRC status.
     */
    public function test_non_customer_cannot_get_nrc_status(): void
    {
        // Create admin
        $adminRole = Role::where('name', 'admin')->first();
        $admin = User::create([
            'phone_number' => '09987654321',
            'role_id' => $adminRole->id,
            'full_name' => 'Test Admin',
            'status' => 'active',
            'is_phone_verified' => true,
            'is_pin_created' => true,
        ]);

        $response = $this->actingAs($admin)
            ->getJson('/api/profile/nrc/status');

        $response->assertStatus(403)
            ->assertJsonPath('message', 'Only customers can check NRC status.');
    }
}

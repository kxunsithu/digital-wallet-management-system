<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Role;
use App\Models\CustomerProfile;
use App\Models\NrcVerification;
use App\Models\AuditLog;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class NrcVerificationTest extends TestCase
{
    use RefreshDatabase;

    private User $customer;
    private User $admin;
    private NrcVerification $nrcVerification;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');

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

        // Create admin user
        $adminRole = Role::where('name', 'admin')->first();
        $this->admin = User::create([
            'phone_number' => '09987654321',
            'role_id' => $adminRole->id,
            'full_name' => 'Test Admin',
            'status' => 'active',
            'is_phone_verified' => true,
            'is_pin_created' => true,
        ]);

        // Create a pending NRC verification
        $this->nrcVerification = NrcVerification::create([
            'user_id' => $this->customer->id,
            'nrc_front_image_path' => 'nrc/front/test.jpg',
            'nrc_back_image_path' => 'nrc/back/test.jpg',
            'status' => 'pending',
        ]);
    }

    /**
     * Test admin can view pending NRC verifications.
     */
    public function test_admin_can_view_pending_nrc_verifications(): void
    {
        $response = $this->actingAs($this->admin)
            ->getJson('/api/admin/nrc-verifications?status=pending');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'NRC verifications retrieved.')
            ->assertJsonStructure([
                'data' => [
                    'nrc_verifications' => [
                        [
                            'id',
                            'user_id',
                            'nrc_front_image',
                            'nrc_back_image',
                            'status',
                            'created_at',
                        ],
                    ],
                    'pagination',
                ],
            ]);
    }

    /**
     * Test admin can filter by status.
     */
    public function test_admin_can_filter_nrc_verifications_by_status(): void
    {
        // Create an approved verification
        NrcVerification::create([
            'user_id' => $this->customer->id,
            'nrc_front_image_path' => 'nrc/front/test2.jpg',
            'status' => 'approved',
            'verified_by' => $this->admin->id,
            'verified_at' => now(),
        ]);

        // Get approved only
        $response = $this->actingAs($this->admin)
            ->getJson('/api/admin/nrc-verifications?status=approved');

        $response->assertStatus(200);
        $data = $response->json('data.nrc_verifications');
        $this->assertEquals(1, count($data));
        $this->assertEquals('approved', $data[0]['status']);
    }

    /**
     * Test admin can approve NRC verification.
     */
    public function test_admin_can_approve_nrc_verification(): void
    {
        $response = $this->actingAs($this->admin)
            ->patchJson("/api/admin/nrc-verifications/{$this->nrcVerification->id}", [
                'status' => 'approved',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'NRC verified successfully. Customer level upgraded.')
            ->assertJsonPath('data.status', 'approved')
            ->assertJsonPath('data.new_customer_level', 'silver');

        // Verify in database
        $this->nrcVerification->refresh();
        $this->assertEquals('approved', $this->nrcVerification->status);
        $this->assertEquals($this->admin->id, $this->nrcVerification->verified_by);
        $this->assertNotNull($this->nrcVerification->verified_at);

        // Verify customer level upgraded
        $this->customer->customerProfile->refresh();
        $this->assertEquals('silver', $this->customer->customerProfile->level);
        $this->assertEquals('approved', $this->customer->customerProfile->kyc_status);

        // Verify audit log created
        $this->assertDatabaseHas('audit_logs', [
            'action' => 'nrc_approved',
            'target_table' => 'nrc_verifications',
            'target_id' => $this->nrcVerification->id,
        ]);
    }

    /**
     * Test admin can reject NRC verification.
     */
    public function test_admin_can_reject_nrc_verification(): void
    {
        $rejectionReason = 'NRC images are not clear';

        $response = $this->actingAs($this->admin)
            ->patchJson("/api/admin/nrc-verifications/{$this->nrcVerification->id}", [
                'status' => 'rejected',
                'rejection_reason' => $rejectionReason,
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'NRC rejected. Customer notified.')
            ->assertJsonPath('data.status', 'rejected')
            ->assertJsonPath('data.rejection_reason', $rejectionReason);

        // Verify in database
        $this->nrcVerification->refresh();
        $this->assertEquals('rejected', $this->nrcVerification->status);
        $this->assertEquals($rejectionReason, $this->nrcVerification->rejection_reason);

        // Verify audit log created
        $this->assertDatabaseHas('audit_logs', [
            'action' => 'nrc_rejected',
            'target_table' => 'nrc_verifications',
            'target_id' => $this->nrcVerification->id,
        ]);
    }

    /**
     * Test admin cannot verify already verified NRC.
     */
    public function test_admin_cannot_verify_already_approved_nrc(): void
    {
        // First approval
        $this->actingAs($this->admin)
            ->patchJson("/api/admin/nrc-verifications/{$this->nrcVerification->id}", [
                'status' => 'approved',
            ]);

        // Try to approve again
        $response = $this->actingAs($this->admin)
            ->patchJson("/api/admin/nrc-verifications/{$this->nrcVerification->id}", [
                'status' => 'approved',
            ]);

        $response->assertStatus(404)
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'NRC is already approved.');
    }

    /**
     * Test rejection reason is required for rejection.
     */
    public function test_rejection_reason_is_required_for_rejection(): void
    {
        $response = $this->actingAs($this->admin)
            ->patchJson("/api/admin/nrc-verifications/{$this->nrcVerification->id}", [
                'status' => 'rejected',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['rejection_reason']);
    }

    /**
     * Test customer level upgrade path.
     */
    public function test_customer_level_upgrade_path(): void
    {
        $levels = ['basic', 'silver', 'gold', 'platinum'];

        foreach ($levels as $currentLevel) {
            // Create customer with current level
            $customer = User::create([
                'phone_number' => '0912345678' . rand(1000, 9999),
                'role_id' => Role::where('name', 'customer')->first()->id,
                'full_name' => 'Customer ' . $currentLevel,
                'status' => 'active',
                'is_phone_verified' => true,
                'is_pin_created' => true,
            ]);

            CustomerProfile::create([
                'user_id' => $customer->id,
                'level' => $currentLevel,
            ]);

            // Create and approve NRC
            $nrc = NrcVerification::create([
                'user_id' => $customer->id,
                'nrc_front_image_path' => 'nrc/front/test.jpg',
                'status' => 'pending',
            ]);

            $this->actingAs($this->admin)
                ->patchJson("/api/admin/nrc-verifications/{$nrc->id}", [
                    'status' => 'approved',
                ]);

            // Verify upgrade
            $customer->customerProfile->refresh();
            $expectedLevel = $currentLevel === 'platinum' ? 'platinum' : $levels[array_search($currentLevel, $levels) + 1];
            $this->assertEquals($expectedLevel, $customer->customerProfile->level);
        }
    }

    /**
     * Test non-admin cannot verify NRC.
     */
    public function test_non_admin_cannot_verify_nrc(): void
    {
        $response = $this->actingAs($this->customer)
            ->patchJson("/api/admin/nrc-verifications/{$this->nrcVerification->id}", [
                'status' => 'approved',
            ]);

        $response->assertStatus(403);
    }
}

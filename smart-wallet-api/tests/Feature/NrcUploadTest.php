<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Role;
use App\Models\CustomerProfile;
use App\Models\NrcVerification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class NrcUploadTest extends TestCase
{
    use RefreshDatabase;

    private User $customer;
    private User $admin;

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
    }

    /**
     * Test customer can upload both NRC images.
     */
    public function test_customer_can_upload_both_nrc_images(): void
    {
        Storage::fake('public');

        $response = $this->actingAs($this->customer)
            ->postJson('/api/v1/profile/nrc/upload', [
                'nrc_front_image' => UploadedFile::fake()->image('nrc_front.jpg'),
                'nrc_back_image' => UploadedFile::fake()->image('nrc_back.jpg'),
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'NRC images uploaded successfully. Waiting for admin verification.')
            ->assertJsonStructure([
                'data' => [
                    'nrc_verification_id',
                    'status',
                    'created_at',
                ],
            ]);

        $this->assertDatabaseHas('nrc_verifications', [
            'user_id' => $this->customer->id,
            'status' => 'pending',
        ]);
    }

    /**
     * Test customer can upload only front NRC image.
     */
    public function test_customer_can_upload_only_front_nrc_image(): void
    {
        Storage::fake('public');

        $response = $this->actingAs($this->customer)
            ->postJson('/api/v1/profile/nrc/upload', [
                'nrc_front_image' => UploadedFile::fake()->image('nrc_front.jpg'),
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->assertDatabaseHas('nrc_verifications', [
            'user_id' => $this->customer->id,
            'status' => 'pending',
        ]);
    }

    /**
     * Test customer can upload only back NRC image.
     */
    public function test_customer_can_upload_only_back_nrc_image(): void
    {
        Storage::fake('public');

        $response = $this->actingAs($this->customer)
            ->postJson('/api/v1/profile/nrc/upload', [
                'nrc_back_image' => UploadedFile::fake()->image('nrc_back.jpg'),
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->assertDatabaseHas('nrc_verifications', [
            'user_id' => $this->customer->id,
            'status' => 'pending',
        ]);
    }

    /**
     * Test customer cannot upload without any image.
     */
    public function test_customer_cannot_upload_without_any_image(): void
    {
        $response = $this->actingAs($this->customer)
            ->postJson('/api/v1/profile/nrc/upload', []);

        $response->assertStatus(422)
            ->assertJsonPath('success', false);
    }

    /**
     * Test customer cannot upload with invalid image format.
     */
    public function test_customer_cannot_upload_invalid_image_format(): void
    {
        $response = $this->actingAs($this->customer)
            ->postJson('/api/v1/profile/nrc/upload', [
                'nrc_front_image' => UploadedFile::fake()->create('nrc_front.pdf', 100),
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['nrc_front_image']);
    }

    /**
     * Test customer cannot upload oversized image.
     */
    public function test_customer_cannot_upload_oversized_image(): void
    {
        $response = $this->actingAs($this->customer)
            ->postJson('/api/v1/profile/nrc/upload', [
                'nrc_front_image' => UploadedFile::fake()->image('nrc_front.jpg')->size(6 * 1024), // 6MB
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['nrc_front_image']);
    }

    /**
     * Test uploading new NRC deletes old pending verification.
     */
    public function test_new_nrc_upload_deletes_old_pending_verification(): void
    {
        Storage::fake('public');

        // First upload
        $this->actingAs($this->customer)
            ->postJson('/api/v1/profile/nrc/upload', [
                'nrc_front_image' => UploadedFile::fake()->image('nrc_front.jpg'),
            ]);

        $this->assertDatabaseHas('nrc_verifications', [
            'user_id' => $this->customer->id,
            'status' => 'pending',
        ]);

        // Second upload
        $this->actingAs($this->customer)
            ->postJson('/api/v1/profile/nrc/upload', [
                'nrc_front_image' => UploadedFile::fake()->image('nrc_front2.jpg'),
            ]);

        // Only one pending record should exist
        $this->assertEquals(1, NrcVerification::where('user_id', $this->customer->id)->where('status', 'pending')->count());
    }

    /**
     * Test only customers can upload NRC.
     */
    public function test_only_customers_can_upload_nrc(): void
    {
        $response = $this->actingAs($this->admin)
            ->postJson('/api/profile/nrc/upload', [
                'nrc_front_image' => UploadedFile::fake()->image('nrc_front.jpg'),
            ]);

        $response->assertStatus(403)
            ->assertJsonPath('message', 'Only customers can upload NRC images.');
    }
}

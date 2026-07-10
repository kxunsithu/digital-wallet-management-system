<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class UserProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_view_their_profile(): void
    {
        $role = Role::create(['name' => 'customer', 'description' => 'Customer']);
        $user = User::create([
            'phone_number' => '09911111111',
            'role_id' => $role->id,
            'full_name' => 'Aye Aye',
            'email' => 'aye@example.com',
            'nrc_number' => '12/ABC(N)123456',
            'status' => 'active',
            'is_phone_verified' => true,
            'is_pin_created' => true,
        ]);

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/profile');

        $response->assertStatus(200)
            ->assertJsonPath('data.full_name', 'Aye Aye');
    }

    public function test_authenticated_user_can_update_their_profile(): void
    {
        $role = Role::create(['name' => 'customer', 'description' => 'Customer']);
        $user = User::create([
            'phone_number' => '09922222222',
            'role_id' => $role->id,
            'full_name' => 'Old Name',
            'email' => 'old@example.com',
            'nrc_number' => '12/ABC(N)111111',
            'status' => 'active',
            'is_phone_verified' => true,
            'is_pin_created' => true,
        ]);

        Sanctum::actingAs($user);

        $response = $this->patchJson('/api/profile', [
            'full_name' => 'New Name',
            'email' => 'new@example.com',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.full_name', 'New Name')
            ->assertJsonPath('data.email', 'new@example.com');
    }
}

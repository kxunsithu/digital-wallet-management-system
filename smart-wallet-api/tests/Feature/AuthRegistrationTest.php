<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthRegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_complete_registration_with_full_name_and_nrc_number(): void
    {
        Role::create(['name' => 'customer', 'description' => 'Customer']);

        $user = User::create([
            'phone_number' => '09911111111',
            'role_id' => Role::where('name', 'customer')->value('id'),
            'status' => 'pending',
            'is_phone_verified' => true,
            'is_pin_created' => false,
        ]);

        $response = $this->postJson('/api/auth/create-pin', [
            'user_id' => $user->id,
            'full_name' => 'Aye Aye',
            'nrc_number' => '12/ABC(N)123456',
            'pin' => '1234',
            'pin_confirmation' => '1234',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.user.full_name', 'Aye Aye');

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'full_name' => 'Aye Aye',
            'nrc_number' => '12/ABC(N)123456',
            'is_pin_created' => true,
        ]);
    }

    public function test_registration_fails_when_nrc_number_is_already_used(): void
    {
        Role::create(['name' => 'customer', 'description' => 'Customer']);

        $existingUser = User::create([
            'phone_number' => '09911111111',
            'role_id' => Role::where('name', 'customer')->value('id'),
            'status' => 'active',
            'is_phone_verified' => true,
            'is_pin_created' => true,
            'full_name' => 'Existing User',
            'nrc_number' => '12/ABC(N)123456',
        ]);

        $newUser = User::create([
            'phone_number' => '09922222222',
            'role_id' => Role::where('name', 'customer')->value('id'),
            'status' => 'pending',
            'is_phone_verified' => true,
            'is_pin_created' => false,
        ]);

        $response = $this->postJson('/api/auth/create-pin', [
            'user_id' => $newUser->id,
            'full_name' => 'New User',
            'nrc_number' => $existingUser->nrc_number,
            'pin' => '1234',
            'pin_confirmation' => '1234',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['nrc_number']);
    }
}

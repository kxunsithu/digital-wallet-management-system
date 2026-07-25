<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class ImageStorageTest extends TestCase
{
    use RefreshDatabase;

    public function test_profile_image_is_stored_in_images_table(): void
    {
        DB::table('roles')->insert([
            'id' => 1,
            'name' => 'customer',
            'description' => 'Customer',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $user = User::create([
            'phone_number' => '09144444444',
            'role_id' => 1,
            'status' => 'active',
        ]);

        $response = $this->actingAs($user, 'sanctum')->putJson('/api/profile', [
            'profile_image' => '/uploads/profile.jpg',
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('images', [
            'user_id' => $user->id,
            'image_type' => 'profile_image',
            'image_path' => '/uploads/profile.jpg',
        ]);
    }
}

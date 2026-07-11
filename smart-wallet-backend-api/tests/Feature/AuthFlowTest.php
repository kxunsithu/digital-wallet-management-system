<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class AuthFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_verify_otp_returns_create_pin_step_for_new_user(): void
    {
        $user = new \App\Models\User();
        $user->phone_number = '09123456789';
        $user->is_pin_created = false;
        $user->status = 'active';
        $user->save();

        DB::table('otp_verifications')->insert([
            'user_id' => $user->id,
            'phone_number' => $user->phone_number,
            'otp_code' => '123456',
            'purpose' => 'login',
            'status' => 'pending',
            'attempt_count' => 0,
            'expires_at' => now()->addMinutes(5),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $response = $this->postJson('/api/auth/verify-otp', [
            'phone_number' => $user->phone_number,
            'otp_code' => '123456',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.next_step', 'create_pin');
    }
}

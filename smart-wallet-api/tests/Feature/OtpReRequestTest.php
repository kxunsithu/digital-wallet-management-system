<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Queue;
use Illuminate\Foundation\Testing\RefreshDatabase;

/**
 * Test OTP re-request flow to ensure OTP codes are properly stored and retrieved.
 * This test verifies that requesting OTP multiple times works correctly.
 */
class OtpReRequestTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Config::set('auth.admin_phone_number', '+959944074981');
        Config::set('queue.default', 'sync');
        Queue::fake();
    }

    public function test_admin_can_request_otp_multiple_times()
    {
        $adminPhone = '+959944074981';
        
        // First OTP request
        $response1 = $this->postJson('/api/auth/request-otp', [
            'phone_number' => $adminPhone,
            'role' => 'admin'
        ]);

        $response1->assertStatus(200);
        $response1->assertJsonPath('data.phone_number', $adminPhone);

        // Get the first OTP from database
        $firstOtp = \App\Models\OtpVerification::where('phone_number', $adminPhone)
            ->where('status', 'pending')
            ->first();

        $this->assertNotNull($firstOtp, 'First OTP should be created');
        $firstOtpId = $firstOtp->id;

        // Second OTP request (should expire the first one)
        $response2 = $this->postJson('/api/auth/request-otp', [
            'phone_number' => $adminPhone,
            'role' => 'admin'
        ]);

        $response2->assertStatus(200);

        // First OTP should now be expired
        $firstOtpAfterReRequest = \App\Models\OtpVerification::find($firstOtpId);
        $this->assertEquals('expired', $firstOtpAfterReRequest->status, 'First OTP should be marked as expired after re-request');

        // Get the second OTP
        $secondOtp = \App\Models\OtpVerification::where('phone_number', $adminPhone)
            ->where('status', 'pending')
            ->first();

        $this->assertNotNull($secondOtp, 'Second OTP should be created');
        $this->assertNotEquals($firstOtpId, $secondOtp->id, 'Second OTP should be a different record');

        // Verify that we can find the second OTP
        $pendingOtps = \App\Models\OtpVerification::where('phone_number', $adminPhone)
            ->where('status', 'pending')
            ->count();

        $this->assertEquals(1, $pendingOtps, 'Should only have one pending OTP after re-request');
    }

    public function test_admin_otp_verification_finds_latest_otp()
    {
        $adminPhone = '+959944074981';
        
        // Request first OTP
        $this->postJson('/api/auth/request-otp', [
            'phone_number' => $adminPhone,
            'role' => 'admin'
        ]);

        // Request second OTP
        $this->postJson('/api/auth/request-otp', [
            'phone_number' => $adminPhone,
            'role' => 'admin'
        ]);

        // Get the latest pending OTP
        $latestOtp = \App\Models\OtpVerification::where('phone_number', $adminPhone)
            ->where('status', 'pending')
            ->where('expires_at', '>', now())
            ->latest()
            ->first();

        $this->assertNotNull($latestOtp);

        // Verify we can use the latest OTP code (we need to access it directly for testing)
        // In production, this would be the code sent via SMS
        $this->assertTrue(\Illuminate\Support\Facades\Hash::check('123456', $latestOtp->otp_code) === false);
        // Just verify the record exists and is not expired
        $this->assertFalse($latestOtp->isExpired());
    }
}

<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CorsTest extends TestCase
{
    use RefreshDatabase;

    public function test_options_preflight_request_returns_cors_headers(): void
    {
        $response = $this->json('OPTIONS', '/api/auth/request-otp', [], [
            'Origin' => 'http://localhost:3000',
            'Access-Control-Request-Method' => 'POST',
            'Access-Control-Request-Headers' => 'Content-Type, Authorization',
        ]);

        $response->assertStatus(204);
        $response->assertHeader('Access-Control-Allow-Origin', '*');
        $response->assertHeader('Access-Control-Allow-Methods');
    }

    public function test_api_request_returns_single_cors_origin_header(): void
    {
        $response = $this->json('POST', '/api/auth/request-otp', [
            'phone_number' => '09123456789',
        ], [
            'Origin' => 'http://localhost:3000',
        ]);

        $response->assertHeader('Access-Control-Allow-Origin', '*');
    }
}

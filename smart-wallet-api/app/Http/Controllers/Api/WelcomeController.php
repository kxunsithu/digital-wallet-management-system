<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Responses\ApiResponse;
use Illuminate\Http\Request;

class WelcomeController extends Controller
{
    /**
     * GET /api/v1/welcome
     * Public endpoint that returns a friendly greeting.
     */
    public function welcome(Request $request)
    {
        return ApiResponse::success('Welcome to the Digital Wallet Management System API', [
            'message' => 'Hello! This is the public welcome endpoint.',
            'timestamp' => now()->toDateTimeString(),
        ]);
    }

    /**
     * GET /api/v1/endpoint
     * Example versioned endpoint returning basic JSON data.
     */
    public function endpoint(Request $request)
    {
        return ApiResponse::success('Versioned endpoint response', [
            'version' => 'v1',
            'status' => 'operational',
            'features' => ['auth', 'wallet', 'qr', 'agent', 'admin'],
        ]);
    }
}

<?php

namespace Tests\Unit;

use App\Http\Controllers\Api\AuthController;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class AuthControllerOtpTest extends TestCase
{
    public function test_it_posts_to_the_correct_infinireach_endpoint_when_local_environment_is_used(): void
    {
        app()->detectEnvironment(fn () => 'local');

        config()->set('services.infinireach', [
            'api_key' => 'test-key',
            'sender_number' => '+959944074981',
            'base_url' => 'https://api.infinireach.io/api/v1/messages',
            'test_mode' => false,
        ]);

        Http::fake([
            '*' => Http::response(['status' => 'ok'], 200),
        ]);

        $controller = new AuthController();
        $method = new \ReflectionMethod(AuthController::class, 'sendOtpCode');
        $method->setAccessible(true);

        $result = $method->invoke($controller, '+959123456789', '123456');

        $this->assertTrue($result['success']);
        Http::assertSent(function ($request) {
            return $request->url() === 'https://api.infinireach.io/api/v1/messages';
        });
    }
}

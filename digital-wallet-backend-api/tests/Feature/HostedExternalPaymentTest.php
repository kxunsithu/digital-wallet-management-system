<?php

namespace Tests\Feature;

use App\Models\CustomerProfile;
use App\Models\ExternalSystem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Testing\TestResponse;
use Tests\TestCase;

class HostedExternalPaymentTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        DB::table('roles')->insert([
            ['id' => 1, 'name' => 'admin', 'description' => 'Admin', 'created_at' => now(), 'updated_at' => now()],
            ['id' => 3, 'name' => 'agent', 'description' => 'Agent', 'created_at' => now(), 'updated_at' => now()],
            ['id' => 4, 'name' => 'customer', 'description' => 'Customer', 'created_at' => now(), 'updated_at' => now()],
        ]);

        DB::table('transfer_settings')->insert([
            'id' => 1,
            'unverified_customer_transfer_limit' => 100000,
            'customer_transfer_fee_percent' => 0.5,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    protected function makeUser(string $phone, int $roleId, string $status = 'active'): User
    {
        return User::create([
            'phone_number' => $phone,
            'role_id' => $roleId,
            'full_name' => 'User '.$phone,
            'status' => $status,
            'is_phone_verified' => true,
        ]);
    }

    protected function makeWallet(User $user, float $balance): int
    {
        return DB::table('wallets')->insertGetId([
            'user_id' => $user->id,
            'wallet_number' => 'WAL-'.strtoupper(bin2hex(random_bytes(4))),
            'balance' => $balance,
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    protected function makePin(User $user, string $pin = '1234'): void
    {
        DB::table('pins')->insert([
            'user_id' => $user->id,
            'pin_hash' => Hash::make($pin),
            'failed_attempts' => 0,
            'is_locked' => false,
            'locked_until' => null,
            'last_changed_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    protected function makeCustomer(string $phone, string $kycStatus, float $balance): array
    {
        $user = $this->makeUser($phone, 4);
        CustomerProfile::create(['user_id' => $user->id, 'kyc_status' => $kycStatus]);
        $this->makeWallet($user, $balance);
        $this->makePin($user);

        return [$user];
    }

    protected function makeAgent(string $phone, float $balance): array
    {
        $user = $this->makeUser($phone, 3);
        DB::table('agent_profiles')->insert([
            'user_id' => $user->id,
            'agent_code' => 'AGT-'.strtoupper(bin2hex(random_bytes(3))),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $walletId = $this->makeWallet($user, $balance);
        $this->makePin($user);

        return [$user, $walletId];
    }

    protected function makeExternalSystem(string $apiKey, User $agent): ExternalSystem
    {
        return ExternalSystem::create([
            'name' => 'Test Shopping',
            'user_id' => $agent->id,
            'system_link' => 'https://shop.example.com',
            'api_key_hash' => hash('sha256', $apiKey),
            'api_key_prefix' => substr($apiKey, 0, 12),
            'status' => 'active',
        ]);
    }

    protected function makeAdmin(): int
    {
        $admin = $this->makeUser('09111111111', 1);

        return $this->makeWallet($admin, 1000000);
    }

    protected function initiate(string $apiKey, array $payload): TestResponse
    {
        return $this->postJson('/api/external/payments/initiate', $payload, ['X-API-Key' => $apiKey]);
    }

    protected function otpForPayment(string $reference): string
    {
        $paymentId = DB::table('external_payments')->where('reference', $reference)->value('id');

        return (string) DB::table('otp_verifications')
            ->where('user_id', DB::table('external_payments')->where('id', $paymentId)->value('customer_user_id'))
            ->where('purpose', 'external_payment:'.$paymentId)
            ->latest('created_at')
            ->value('otp_code');
    }

    protected function makePendingPayment(?string $redirectUrl = null): array
    {
        $adminWalletId = $this->makeAdmin();
        [$customer] = $this->makeCustomer('09123456789', 'verified', 500000);
        [$agent, $agentWalletId] = $this->makeAgent('09122222222', 100000);
        $this->makeExternalSystem($apiKey = 'sk_live_testkey123', $agent);
        $customerWalletId = $customer->wallet()->first()->id;

        $payload = [
            'customer_phone' => '09123456789',
            'amount' => 20000,
            'order_reference' => 'ORD-001',
        ];

        if ($redirectUrl !== null) {
            $payload['redirect_url'] = $redirectUrl;
        }

        $reference = $this->initiate($apiKey, $payload)->json('data.payment_reference');

        return compact('reference', 'customer', 'customerWalletId', 'agentWalletId', 'adminWalletId');
    }

    public function test_initiate_returns_payment_url_and_stores_redirect_url(): void
    {
        $this->makeAdmin();
        [$customer] = $this->makeCustomer('09123456789', 'verified', 500000);
        [$agent] = $this->makeAgent('09122222222', 100000);
        $this->makeExternalSystem($apiKey = 'sk_live_testkey123', $agent);

        $response = $this->initiate($apiKey, [
            'customer_phone' => '09123456789',
            'amount' => 20000,
            'redirect_url' => 'https://shop.example.com/checkout/complete',
        ]);

        $response->assertStatus(201);
        $reference = $response->json('data.payment_reference');

        $this->assertStringContainsString("/external-payments/pay/{$reference}", $response->json('data.payment_url'));
        $this->assertDatabaseHas('external_payments', [
            'reference' => $reference,
            'redirect_url' => 'https://shop.example.com/checkout/complete',
        ]);
    }

    public function test_hosted_page_displays_payment_details(): void
    {
        $this->makeAdmin();
        [$customer] = $this->makeCustomer('09123456789', 'verified', 500000);
        [$agent] = $this->makeAgent('09122222222', 100000);
        $this->makeExternalSystem($apiKey = 'sk_live_testkey123', $agent);

        $reference = $this->initiate($apiKey, [
            'customer_phone' => '09123456789',
            'amount' => 20000,
            'order_reference' => 'ORD-001',
            'description' => 'Laptop',
        ])->json('data.payment_reference');

        $this->get("/external-payments/pay/{$reference}")
            ->assertStatus(200)
            ->assertSee('Confirm your payment')
            ->assertSee('20,000.00 MMK')
            ->assertSee('Laptop')
            ->assertSee('ORD-001')
            ->assertSee('Pay', false);
    }

    public function test_hosted_pay_completes_payment_and_redirects_back(): void
    {
        $reference = $this->makePendingPayment('https://shop.example.com/checkout/complete')['reference'];
        $otp = $this->otpForPayment($reference);

        $response = $this->post("/external-payments/pay/{$reference}", [
            'otp' => $otp,
            'pin' => '1234',
        ]);

        $response->assertStatus(302);
        $response->assertRedirect('https://shop.example.com/checkout/complete?'.http_build_query([
            'reference' => $reference,
            'order_reference' => 'ORD-001',
            'status' => 'success',
            'message' => 'Payment completed successfully.',
        ]));

        $this->assertDatabaseHas('external_payments', [
            'reference' => $reference,
            'status' => 'completed',
        ]);

        $this->assertDatabaseCount('transactions', 1);
    }

    public function test_hosted_pay_wrong_otp_rerenders_form_without_touching_balance(): void
    {
        $payment = $this->makePendingPayment('https://shop.example.com/checkout/complete');
        $reference = $payment['reference'];
        $payUrl = "/external-payments/pay/{$reference}";

        $response = $this->withHeaders(['Referer' => $payUrl])
            ->post($payUrl, [
                'otp' => '000000',
                'pin' => '1234',
            ]);

        $response->assertRedirect($payUrl);
        $response->assertSessionHasErrors('payment');
        $this->assertDatabaseHas('external_payments', ['reference' => $reference, 'status' => 'pending']);
        $this->assertDatabaseHas('wallets', ['id' => $payment['customerWalletId'], 'balance' => 500000]);
        $this->assertDatabaseCount('transactions', 0);
    }

    public function test_hosted_pay_without_redirect_url_shows_result_page(): void
    {
        $payment = $this->makePendingPayment();
        $reference = $payment['reference'];

        $response = $this->post("/external-payments/pay/{$reference}", [
            'otp' => $this->otpForPayment($reference),
            'pin' => '1234',
        ]);

        $response->assertStatus(200);
        $response->assertSee('Payment Successful');
        $response->assertSee('Payment completed successfully.');
        $this->assertDatabaseHas('external_payments', ['reference' => $reference, 'status' => 'completed']);
    }

    public function test_hosted_pay_expired_payment_redirects_with_failure(): void
    {
        $reference = $this->makePendingPayment('https://shop.example.com/checkout/complete')['reference'];

        DB::table('external_payments')->where('reference', $reference)->update(['expires_at' => now()->subMinute()]);

        $response = $this->post("/external-payments/pay/{$reference}", [
            'otp' => $this->otpForPayment($reference),
            'pin' => '1234',
        ]);

        $response->assertStatus(302);
        $response->assertRedirect('https://shop.example.com/checkout/complete?'.http_build_query([
            'reference' => $reference,
            'order_reference' => 'ORD-001',
            'status' => 'failed',
            'message' => 'This payment request has expired. Please initiate a new payment.',
        ]));

        $this->assertDatabaseHas('external_payments', ['reference' => $reference, 'status' => 'expired']);
        $this->assertDatabaseCount('transactions', 0);
    }

    public function test_hosted_page_for_non_pending_payment_shows_result(): void
    {
        $reference = $this->makePendingPayment('https://shop.example.com/checkout/complete')['reference'];

        $this->post("/external-payments/pay/{$reference}", [
            'otp' => $this->otpForPayment($reference),
            'pin' => '1234',
        ])->assertStatus(302);

        $this->get("/external-payments/pay/{$reference}")
            ->assertStatus(200)
            ->assertSee('Payment Successful');
    }

    public function test_hosted_page_unknown_reference_returns_404(): void
    {
        $this->get('/external-payments/pay/PAY-UNKNOWN')->assertStatus(404);

        $this->post('/external-payments/pay/PAY-UNKNOWN', ['otp' => '123456', 'pin' => '1234'])
            ->assertStatus(404);
    }

    public function test_initiate_rejects_invalid_redirect_url(): void
    {
        $this->makeAdmin();
        [$customer] = $this->makeCustomer('09123456789', 'verified', 500000);
        [$agent] = $this->makeAgent('09122222222', 100000);
        $this->makeExternalSystem($apiKey = 'sk_live_testkey123', $agent);

        $this->initiate($apiKey, [
            'customer_phone' => '09123456789',
            'amount' => 20000,
            'redirect_url' => 'not-a-valid-url',
        ])->assertStatus(422);

        $this->assertDatabaseCount('external_payments', 0);
    }
}

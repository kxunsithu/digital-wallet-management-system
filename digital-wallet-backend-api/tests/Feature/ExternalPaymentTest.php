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

class ExternalPaymentTest extends TestCase
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

    protected function makeExternalSystem(string $apiKey, User $agent, string $status = 'active'): ExternalSystem
    {
        return ExternalSystem::create([
            'name' => 'Test Shopping',
            'user_id' => $agent->id,
            'system_link' => 'https://shop.example.com',
            'api_key_hash' => hash('sha256', $apiKey),
            'api_key_prefix' => substr($apiKey, 0, 12),
            'status' => $status,
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

    public function test_initiate_requires_valid_api_key(): void
    {
        $this->initiate('wrong-key', [
            'customer_phone' => '09123456789',
            'amount' => 1000,
        ])->assertStatus(401);

        $this->postJson('/api/external/payments/initiate', [
            'customer_phone' => '09123456789',
            'amount' => 1000,
        ])->assertStatus(401);
    }

    public function test_initiate_creates_pending_payment_and_issues_otp(): void
    {
        $this->makeAdmin();
        [$customer] = $this->makeCustomer('09123456789', 'verified', 500000);
        [$agent] = $this->makeAgent('09122222222', 100000);
        $this->makeExternalSystem($apiKey = 'sk_live_testkey123', $agent);

        $response = $this->initiate($apiKey, [
            'customer_phone' => '09123456789',
            'amount' => 20000,
            'order_reference' => 'ORD-001',
            'description' => 'Online shopping order',
        ]);

        $response->assertStatus(201);
        $response->assertJsonPath('data.amount', 20000);
        $response->assertJsonPath('data.fee', 100);
        $response->assertJsonPath('data.total', 20100);

        $this->assertDatabaseHas('external_payments', [
            'reference' => $response->json('data.payment_reference'),
            'customer_user_id' => $customer->id,
            'agent_user_id' => $agent->id,
            'amount' => 20000,
            'fee' => 100,
            'status' => 'pending',
            'order_reference' => 'ORD-001',
        ]);

        $this->assertDatabaseHas('otp_verifications', [
            'user_id' => $customer->id,
            'purpose' => 'external_payment:'.DB::table('external_payments')->where('reference', $response->json('data.payment_reference'))->value('id'),
            'status' => 'pending',
        ]);
    }

    public function test_initiate_uses_the_agent_bound_to_the_system(): void
    {
        $this->makeAdmin();
        [$customer] = $this->makeCustomer('09123456789', 'verified', 500000);
        [$boundAgent] = $this->makeAgent('09122222222', 100000);
        [$otherAgent] = $this->makeAgent('09133333333', 100000);
        $this->makeExternalSystem($apiKey = 'sk_live_testkey123', $boundAgent);

        $response = $this->initiate($apiKey, [
            'customer_phone' => '09123456789',
            'amount' => 1000,
        ])->assertStatus(201);

        $this->assertDatabaseHas('external_payments', [
            'reference' => $response->json('data.payment_reference'),
            'agent_user_id' => $boundAgent->id,
            'external_system_id' => ExternalSystem::where('api_key_hash', hash('sha256', $apiKey))->first()->id,
        ]);

        $this->assertNotSame($boundAgent->id, $otherAgent->id);
    }

    public function test_initiate_rejects_system_not_linked_to_agent(): void
    {
        $this->makeAdmin();
        [$customer] = $this->makeCustomer('09123456789', 'verified', 500000);

        ExternalSystem::create([
            'name' => 'Orphan System',
            'user_id' => null,
            'api_key_hash' => hash('sha256', $apiKey = 'sk_live_orphan123'),
            'api_key_prefix' => 'sk_live_orph',
            'status' => 'active',
        ]);

        $response = $this->initiate($apiKey, [
            'customer_phone' => '09123456789',
            'amount' => 1000,
        ]);

        $response->assertStatus(422);
        $this->assertStringContainsString('not linked to an agent', $response->json('message'));
        $this->assertDatabaseCount('external_payments', 0);
    }

    public function test_initiate_rejects_sender_that_is_not_customer_or_agent(): void
    {
        $this->makeAdmin();
        [$agent] = $this->makeAgent('09122222222', 100000);
        $this->makeExternalSystem($apiKey = 'sk_live_testkey123', $agent);

        // An admin is neither a customer nor an agent and cannot pay.
        $adminSender = $this->makeUser('09133333333', 1);

        $response = $this->initiate($apiKey, [
            'customer_phone' => '09133333333',
            'amount' => 1000,
        ]);

        $response->assertStatus(422);
        $this->assertStringContainsString('Sender must be a customer or an agent', $response->json('message'));
        $this->assertDatabaseCount('external_payments', 0);
    }

    public function test_initiate_unverified_customer_above_limit_rejected(): void
    {
        $this->makeAdmin();
        [$customer] = $this->makeCustomer('09123456789', 'pending', 500000);
        [$agent] = $this->makeAgent('09122222222', 100000);
        $this->makeExternalSystem($apiKey = 'sk_live_testkey123', $agent);

        $response = $this->initiate($apiKey, [
            'customer_phone' => '09123456789',
            'amount' => 200000,
        ]);

        $response->assertStatus(422);
        $this->assertStringContainsString('NRC-verified', $response->json('message'));
        $this->assertDatabaseCount('external_payments', 0);
    }

    public function test_initiate_rejects_customer_without_enough_balance(): void
    {
        $this->makeAdmin();
        [$customer] = $this->makeCustomer('09123456789', 'verified', 500);
        [$agent] = $this->makeAgent('09122222222', 100000);
        $this->makeExternalSystem($apiKey = 'sk_live_testkey123', $agent);

        // Amount 10000 + fee 50 exceeds the customer's 500 balance.
        $response = $this->initiate($apiKey, [
            'customer_phone' => '09123456789',
            'amount' => 10000,
        ]);

        $response->assertStatus(422);
        $this->assertStringContainsString('Insufficient balance', $response->json('message'));

        // No payment intent, no transaction, and no OTP were created.
        $this->assertDatabaseCount('external_payments', 0);
        $this->assertDatabaseCount('transactions', 0);
        $this->assertDatabaseCount('otp_verifications', 0);
    }

    public function test_confirm_completes_payment_and_updates_balances(): void
    {
        $adminWalletId = $this->makeAdmin();
        [$customer] = $this->makeCustomer('09123456789', 'verified', 500000);
        [$agent, $agentWalletId] = $this->makeAgent('09122222222', 100000);
        $this->makeExternalSystem($apiKey = 'sk_live_testkey123', $agent);
        $customerWalletId = $customer->wallet()->first()->id;

        $init = $this->initiate($apiKey, [
            'customer_phone' => '09123456789',
            'amount' => 20000,
        ])->assertStatus(201);

        $reference = $init->json('data.payment_reference');
        $otp = $this->otpForPayment($reference);

        $response = $this->postJson('/api/external/payments/confirm', [
            'payment_reference' => $reference,
            'otp' => $otp,
            'pin' => '1234',
        ], ['X-API-Key' => $apiKey]);

        $response->assertStatus(200);
        $response->assertJsonPath('data.transaction_type', 'external_payment');

        // sender: 500000 - (20000 + 100)
        $this->assertDatabaseHas('wallets', ['id' => $customerWalletId, 'balance' => 479900]);
        // receiver (bound agent): 100000 + 20000
        $this->assertDatabaseHas('wallets', ['id' => $agentWalletId, 'balance' => 120000]);
        // fee to admin wallet (admin started with 1,000,000)
        $this->assertDatabaseHas('wallets', ['id' => $adminWalletId, 'balance' => 1000100]);

        $this->assertDatabaseHas('transactions', [
            'transaction_type' => 'external_payment',
            'sender_wallet_id' => $customerWalletId,
            'receiver_wallet_id' => $agentWalletId,
            'amount' => 20000,
            'fee' => 100,
            'status' => 'completed',
            'external_payment_id' => DB::table('external_payments')->where('reference', $reference)->value('id'),
        ]);

        $this->assertDatabaseHas('external_payments', [
            'reference' => $reference,
            'status' => 'completed',
        ]);

        // OTP is single-use
        $paymentId = DB::table('external_payments')->where('reference', $reference)->value('id');
        $this->assertDatabaseHas('otp_verifications', [
            'user_id' => $customer->id,
            'purpose' => 'external_payment:'.$paymentId,
            'status' => 'used',
        ]);
    }

    public function test_agent_to_agent_transfer_through_external_system(): void
    {
        $adminWalletId = $this->makeAdmin();
        [$senderAgent, $senderWalletId] = $this->makeAgent('09123456789', 500000);
        [$receiverAgent, $receiverWalletId] = $this->makeAgent('09122222222', 100000);
        $this->makeExternalSystem($apiKey = 'sk_live_testkey123', $receiverAgent);

        // 150000 exceeds the 100000 unverified-customer limit, but that limit
        // only applies to customers — agents are trusted senders.
        $init = $this->initiate($apiKey, [
            'customer_phone' => '09123456789',
            'amount' => 150000,
        ])->assertStatus(201);

        $reference = $init->json('data.payment_reference');
        $otp = $this->otpForPayment($reference);

        // OTP was issued to the sender agent, not a customer.
        $this->assertDatabaseHas('external_payments', [
            'reference' => $reference,
            'customer_user_id' => $senderAgent->id,
            'agent_user_id' => $receiverAgent->id,
        ]);

        $response = $this->postJson('/api/external/payments/confirm', [
            'payment_reference' => $reference,
            'otp' => $otp,
            'pin' => '1234',
        ], ['X-API-Key' => $apiKey]);

        $response->assertStatus(200);
        $response->assertJsonPath('data.transaction_type', 'external_payment');

        // sender agent: 500000 - (150000 + 750)
        $this->assertDatabaseHas('wallets', ['id' => $senderWalletId, 'balance' => 349250]);
        // receiver agent: 100000 + 150000
        $this->assertDatabaseHas('wallets', ['id' => $receiverWalletId, 'balance' => 250000]);
        // fee to admin wallet (admin started with 1,000,000)
        $this->assertDatabaseHas('wallets', ['id' => $adminWalletId, 'balance' => 1000750]);

        $this->assertDatabaseHas('transactions', [
            'transaction_type' => 'external_payment',
            'sender_wallet_id' => $senderWalletId,
            'receiver_wallet_id' => $receiverWalletId,
            'receiver_phone' => '09122222222',
            'amount' => 150000,
            'fee' => 750,
            'status' => 'completed',
        ]);
    }

    public function test_initiate_rejects_agent_sending_to_itself(): void
    {
        $this->makeAdmin();
        [$agent] = $this->makeAgent('09122222222', 500000);
        $this->makeExternalSystem($apiKey = 'sk_live_testkey123', $agent);

        $response = $this->initiate($apiKey, [
            'customer_phone' => '09122222222',
            'amount' => 20000,
        ]);

        $response->assertStatus(422);
        $this->assertStringContainsString('Sender and receiver cannot be the same', $response->json('message'));
        $this->assertDatabaseCount('external_payments', 0);
    }

    public function test_confirm_with_invalid_otp_rejected(): void
    {
        $this->makeAdmin();
        [$customer] = $this->makeCustomer('09123456789', 'verified', 500000);
        [$agent] = $this->makeAgent('09122222222', 100000);
        $this->makeExternalSystem($apiKey = 'sk_live_testkey123', $agent);

        $init = $this->initiate($apiKey, [
            'customer_phone' => '09123456789',
            'amount' => 10000,
        ])->assertStatus(201);

        $response = $this->postJson('/api/external/payments/confirm', [
            'payment_reference' => $init->json('data.payment_reference'),
            'otp' => '000000',
            'pin' => '1234',
        ], ['X-API-Key' => $apiKey]);

        $response->assertStatus(422);
        $this->assertDatabaseCount('transactions', 0);
        $this->assertDatabaseHas('external_payments', [
            'reference' => $init->json('data.payment_reference'),
            'status' => 'pending',
        ]);
    }

    public function test_confirm_with_wrong_pin_rejected(): void
    {
        $this->makeAdmin();
        [$customer] = $this->makeCustomer('09123456789', 'verified', 500000);
        [$agent] = $this->makeAgent('09122222222', 100000);
        $this->makeExternalSystem($apiKey = 'sk_live_testkey123', $agent);

        $init = $this->initiate($apiKey, [
            'customer_phone' => '09123456789',
            'amount' => 10000,
        ])->assertStatus(201);

        $response = $this->postJson('/api/external/payments/confirm', [
            'payment_reference' => $init->json('data.payment_reference'),
            'otp' => $this->otpForPayment($init->json('data.payment_reference')),
            'pin' => '9999',
        ], ['X-API-Key' => $apiKey]);

        $response->assertStatus(422);
        $this->assertStringContainsString('PIN', $response->json('message'));
        $this->assertDatabaseCount('transactions', 0);
    }

    public function test_confirm_insufficient_balance_rejected(): void
    {
        $this->makeAdmin();
        // Customer has enough balance to initiate but not enough by confirm time
        // (e.g. funds spent elsewhere while the OTP was pending).
        [$customer] = $this->makeCustomer('09123456789', 'verified', 500000);
        [$agent] = $this->makeAgent('09122222222', 100000);
        $this->makeExternalSystem($apiKey = 'sk_live_testkey123', $agent);

        $init = $this->initiate($apiKey, [
            'customer_phone' => '09123456789',
            'amount' => 10000,
        ])->assertStatus(201);

        $customerWalletId = $customer->wallet()->first()->id;
        DB::table('wallets')->where('id', $customerWalletId)->update(['balance' => 100]);

        $response = $this->postJson('/api/external/payments/confirm', [
            'payment_reference' => $init->json('data.payment_reference'),
            'otp' => $this->otpForPayment($init->json('data.payment_reference')),
            'pin' => '1234',
        ], ['X-API-Key' => $apiKey]);

        $response->assertStatus(422);
        $this->assertStringContainsString('Insufficient balance', $response->json('message'));
        $this->assertDatabaseCount('transactions', 0);
    }

    public function test_confirm_expired_payment_rejected(): void
    {
        $this->makeAdmin();
        [$customer] = $this->makeCustomer('09123456789', 'verified', 500000);
        [$agent] = $this->makeAgent('09122222222', 100000);
        $this->makeExternalSystem($apiKey = 'sk_live_testkey123', $agent);

        $init = $this->initiate($apiKey, [
            'customer_phone' => '09123456789',
            'amount' => 10000,
        ])->assertStatus(201);

        DB::table('external_payments')
            ->where('reference', $init->json('data.payment_reference'))
            ->update(['expires_at' => now()->subMinute()]);

        $response = $this->postJson('/api/external/payments/confirm', [
            'payment_reference' => $init->json('data.payment_reference'),
            'otp' => $this->otpForPayment($init->json('data.payment_reference')),
            'pin' => '1234',
        ], ['X-API-Key' => $apiKey]);

        $response->assertStatus(422);
        $this->assertStringContainsString('expired', $response->json('message'));
        $this->assertDatabaseHas('external_payments', [
            'reference' => $init->json('data.payment_reference'),
            'status' => 'expired',
        ]);
    }

    public function test_confirm_cannot_reuse_completed_payment(): void
    {
        $this->makeAdmin();
        [$customer] = $this->makeCustomer('09123456789', 'verified', 500000);
        [$agent] = $this->makeAgent('09122222222', 100000);
        $this->makeExternalSystem($apiKey = 'sk_live_testkey123', $agent);

        $init = $this->initiate($apiKey, [
            'customer_phone' => '09123456789',
            'amount' => 10000,
        ])->assertStatus(201);

        $reference = $init->json('data.payment_reference');

        $this->postJson('/api/external/payments/confirm', [
            'payment_reference' => $reference,
            'otp' => $this->otpForPayment($reference),
            'pin' => '1234',
        ], ['X-API-Key' => $apiKey])->assertStatus(200);

        $this->postJson('/api/external/payments/confirm', [
            'payment_reference' => $reference,
            'otp' => $this->otpForPayment($reference),
            'pin' => '1234',
        ], ['X-API-Key' => $apiKey])->assertStatus(400);

        $this->assertDatabaseCount('transactions', 1);
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
            'order_reference' => 'PP-ABC123',
            'redirect_url' => 'http://localhost:8000/api/v1/wallet-payment/callback',
        ]);

        $response->assertStatus(201);
        $reference = $response->json('data.payment_reference');

        $this->assertStringContainsString("/external-payments/pay/{$reference}", $response->json('data.payment_url'));
        $this->assertDatabaseHas('external_payments', [
            'reference' => $reference,
            'redirect_url' => 'http://localhost:8000/api/v1/wallet-payment/callback',
        ]);
    }

    public function test_external_can_poll_payment_status(): void
    {
        $this->makeAdmin();
        [$customer] = $this->makeCustomer('09123456789', 'verified', 500000);
        [$agent] = $this->makeAgent('09122222222', 100000);
        $this->makeExternalSystem($apiKey = 'sk_live_testkey123', $agent);

        $init = $this->initiate($apiKey, [
            'customer_phone' => '09123456789',
            'amount' => 20000,
            'order_reference' => 'PP-ABC123',
        ])->assertStatus(201);
        $reference = $init->json('data.payment_reference');

        // pending before confirmation
        $this->getJson('/api/external/payments/'.$reference, ['X-API-Key' => $apiKey])
            ->assertStatus(200)
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonPath('data.order_reference', 'PP-ABC123');

        // completed after confirmation, with the wallet transaction number
        $this->postJson('/api/external/payments/confirm', [
            'payment_reference' => $reference,
            'otp' => $this->otpForPayment($reference),
            'pin' => '1234',
        ], ['X-API-Key' => $apiKey])->assertStatus(200);

        $status = $this->getJson('/api/external/payments/'.$reference, ['X-API-Key' => $apiKey])
            ->assertStatus(200)
            ->assertJsonPath('data.status', 'completed')
            ->assertJsonPath('data.total', 20100);

        $this->assertNotEmpty($status->json('data.transaction_number'));

        $tx = DB::table('transactions')->where('external_payment_id', DB::table('external_payments')->where('reference', $reference)->value('id'))->first();
        $this->assertNotNull($tx);
    }

    public function test_external_status_unknown_reference_returns_404(): void
    {
        $this->makeAdmin();
        [$customer] = $this->makeCustomer('09123456789', 'verified', 500000);
        [$agent] = $this->makeAgent('09122222222', 100000);
        $this->makeExternalSystem($apiKey = 'sk_live_testkey123', $agent);

        $this->getJson('/api/external/payments/PAY-UNKNOWN', ['X-API-Key' => $apiKey])
            ->assertStatus(404);
    }

    public function test_system_info_returns_external_system_details_for_valid_key(): void
    {
        [$agent] = $this->makeAgent('09122222222', 100000);
        $this->makeExternalSystem($apiKey = 'sk_live_testkey123', $agent);

        $response = $this->getJson('/api/external/system-info', ['X-API-Key' => $apiKey])
            ->assertStatus(200)
            ->assertJsonPath('success', true);

        $data = $response->json('data');
        $this->assertSame('Test Shopping', $data['name']);
        $this->assertSame('User 09122222222', $data['account_name']);
        $this->assertSame('09122222222', $data['wallet_phone']);
        $this->assertSame('https://shop.example.com', $data['system_link']);
    }

    public function test_system_info_rejects_invalid_or_inactive_keys(): void
    {
        [$agent] = $this->makeAgent('09122222222', 100000);
        $this->makeExternalSystem('sk_live_testkey123', $agent, status: 'inactive');

        $this->getJson('/api/external/system-info', ['X-API-Key' => 'sk_live_wrongkey999'])
            ->assertStatus(401);

        $this->getJson('/api/external/system-info', ['X-API-Key' => 'sk_live_testkey123'])
            ->assertStatus(401);
    }

    public function test_agent_can_create_external_system_without_generating_key(): void
    {
        [$agent] = $this->makeAgent('09122222222', 100000);

        $create = $this->actingAs($agent, 'sanctum')->postJson('/api/external-systems', [
            'name' => 'My Shop',
            'system_link' => 'https://myshop.example.com',
        ]);
        $create->assertStatus(201);
        $this->assertNull($create->json('data.api_key'));
        $systemId = $create->json('data.id');

        $this->assertDatabaseHas('external_systems', [
            'id' => $systemId,
            'name' => 'My Shop',
            'user_id' => $agent->id,
            'system_link' => 'https://myshop.example.com',
            'api_key_hash' => null,
            'status' => 'active',
        ]);

        // the agent generates the API key themselves
        $generate = $this->actingAs($agent, 'sanctum')->postJson("/api/external-systems/{$systemId}/generate-key");
        $generate->assertStatus(200);
        $apiKey = $generate->json('data.api_key');
        $this->assertNotNull($apiKey);

        $this->assertDatabaseHas('external_systems', [
            'id' => $systemId,
            'api_key_hash' => hash('sha256', $apiKey),
        ]);
    }

    public function test_agent_cannot_generate_key_for_another_agents_system(): void
    {
        [$agent] = $this->makeAgent('09122222222', 100000);
        [$otherAgent] = $this->makeAgent('09133333333', 100000);

        $create = $this->actingAs($agent, 'sanctum')->postJson('/api/external-systems', [
            'name' => 'My Shop',
        ])->assertStatus(201);
        $systemId = $create->json('data.id');

        $this->actingAs($otherAgent, 'sanctum')
            ->postJson("/api/external-systems/{$systemId}/generate-key")
            ->assertStatus(404);

        $this->assertDatabaseHas('external_systems', ['id' => $systemId, 'api_key_hash' => null]);
    }

    public function test_admin_cannot_create_external_system(): void
    {
        $admin = $this->makeUser('09111111111', 1);
        $this->makeWallet($admin, 1000000);

        $this->actingAs($admin, 'sanctum')->postJson('/api/external-systems', [
            'name' => 'Admin Shop',
        ])->assertStatus(403);

        $this->assertDatabaseCount('external_systems', 0);
    }

    public function test_agent_create_external_system_requires_name(): void
    {
        [$agent] = $this->makeAgent('09122222222', 100000);

        $this->actingAs($agent, 'sanctum')->postJson('/api/external-systems', [
            'name' => '',
        ])->assertStatus(422);

        $this->assertDatabaseCount('external_systems', 0);
    }

    public function test_agent_owns_key_round_trip(): void
    {
        $admin = $this->makeUser('09111111111', 1);
        $this->makeWallet($admin, 1000000);
        [$agent] = $this->makeAgent('09122222222', 100000);

        // the agent creates the system (no API key is generated)
        $create = $this->actingAs($agent, 'sanctum')->postJson('/api/external-systems', [
            'name' => 'My Shop',
            'system_link' => 'https://myshop.example.com',
        ]);
        $create->assertStatus(201);
        $this->assertNull($create->json('data.api_key'));
        $systemId = $create->json('data.id');

        // the agent sees only their own systems
        $this->actingAs($agent, 'sanctum')->getJson('/api/external-systems/mine')
            ->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $systemId);

        // the agent generates the key
        $generate = $this->actingAs($agent, 'sanctum')->postJson("/api/external-systems/{$systemId}/generate-key")
            ->assertStatus(200);
        $apiKey = $generate->json('data.api_key');
        $this->assertNotNull($apiKey);

        // the API key is usable for a real payment to the bound agent
        [$customer] = $this->makeCustomer('09123456789', 'verified', 500000);

        $this->initiate($apiKey, [
            'customer_phone' => '09123456789',
            'amount' => 5000,
        ])->assertStatus(201);

        // list as admin includes the bound agent
        $this->actingAs($admin, 'sanctum')->getJson('/api/external-systems')
            ->assertStatus(200)
            ->assertJsonPath('data.data.0.name', 'My Shop')
            ->assertJsonPath('data.data.0.user.phone_number', '09122222222');

        // toggle status inactive -> key stops working
        $this->actingAs($admin, 'sanctum')->postJson("/api/external-systems/{$systemId}/toggle-status")
            ->assertStatus(200);

        $this->initiate($apiKey, [
            'customer_phone' => '09123456789',
            'amount' => 5000,
        ])->assertStatus(401);

        // reactivate
        $this->actingAs($admin, 'sanctum')->postJson("/api/external-systems/{$systemId}/toggle-status")
            ->assertStatus(200);

        // agent regenerates the key -> old key stops working, new key works
        $regen = $this->actingAs($agent, 'sanctum')->postJson("/api/external-systems/{$systemId}/generate-key")
            ->assertStatus(200);
        $newKey = $regen->json('data.api_key');
        $this->assertNotNull($newKey);
        $this->assertNotSame($apiKey, $newKey);

        $this->initiate($apiKey, [
            'customer_phone' => '09123456789',
            'amount' => 5000,
        ])->assertStatus(401);

        $this->initiate($newKey, [
            'customer_phone' => '09123456789',
            'amount' => 5000,
        ])->assertStatus(201);
    }

    public function test_agent_can_list_own_external_payment_history(): void
    {
        $this->makeAdmin();
        [$customer] = $this->makeCustomer('09123456789', 'verified', 500000);
        [$agent] = $this->makeAgent('09122222222', 100000);
        [$otherAgent] = $this->makeAgent('09133333333', 100000);

        $system = $this->makeExternalSystem($apiKey = 'sk_live_testkey123', $agent);
        $otherSystem = $this->makeExternalSystem('sk_live_otherkey456', $otherAgent);

        // one completed payment for our agent, one pending, one for another agent
        $this->initiate($apiKey, ['customer_phone' => '09123456789', 'amount' => 20000])
            ->assertStatus(201);
        $this->initiate($apiKey, ['customer_phone' => '09123456789', 'amount' => 5000])
            ->assertStatus(201);

        $this->initiate('sk_live_otherkey456', ['customer_phone' => '09123456789', 'amount' => 9000])
            ->assertStatus(201);

        $this->actingAs($agent, 'sanctum')->getJson('/api/external-payments/mine')
            ->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonCount(2, 'data.data');

        $refs = collect($this->actingAs($agent, 'sanctum')->getJson('/api/external-payments/mine')->json('data.data'))
            ->pluck('agent_user_id');
        $this->assertTrue($refs->every(fn ($id) => (int) $id === $agent->id));

        // status filter
        $this->actingAs($agent, 'sanctum')->getJson('/api/external-payments/mine?status=completed')
            ->assertStatus(200)
            ->assertJsonCount(0, 'data.data');
    }

    public function test_customer_can_list_own_external_payment_history(): void
    {
        $this->makeAdmin();
        [$customer] = $this->makeCustomer('09123456789', 'verified', 500000);
        [$otherCustomer] = $this->makeCustomer('09144444444', 'verified', 500000);
        [$agent] = $this->makeAgent('09122222222', 100000);
        $this->makeExternalSystem($apiKey = 'sk_live_testkey123', $agent);

        $this->initiate($apiKey, ['customer_phone' => '09123456789', 'amount' => 20000])
            ->assertStatus(201);
        $this->initiate($apiKey, ['customer_phone' => '09144444444', 'amount' => 5000])
            ->assertStatus(201);

        // customers only see their own payments
        $this->actingAs($customer, 'sanctum')->getJson('/api/external-payments/mine')
            ->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonCount(1, 'data.data');

        $ids = collect($this->actingAs($customer, 'sanctum')->getJson('/api/external-payments/mine')->json('data.data'))
            ->pluck('customer_user_id');
        $this->assertTrue($ids->every(fn ($id) => (int) $id === $customer->id));

        // the agent still sees both of theirs
        $this->actingAs($agent, 'sanctum')->getJson('/api/external-payments/mine')
            ->assertStatus(200)
            ->assertJsonCount(2, 'data.data');

        // a non-customer/non-agent role is rejected
        $this->actingAs($this->makeUser('09555555555', 1), 'sanctum')->getJson('/api/external-payments/mine')
            ->assertStatus(403);
    }

    public function test_agent_history_includes_outgoing_agent_to_agent_payments(): void
    {
        $this->makeAdmin();
        [$payerAgent] = $this->makeAgent('09123456789', 500000);
        [$receiverAgent] = $this->makeAgent('09122222222', 100000);
        $this->makeExternalSystem($apiKey = 'sk_live_testkey123', $receiverAgent);

        $this->initiate($apiKey, ['customer_phone' => '09123456789', 'amount' => 20000])
            ->assertStatus(201);

        // The payer agent sees the payment as outgoing.
        $this->actingAs($payerAgent, 'sanctum')->getJson('/api/external-payments/mine')
            ->assertStatus(200)
            ->assertJsonCount(1, 'data.data')
            ->assertJsonPath('data.data.0.direction', 'outgoing');

        // The receiving agent sees the same payment as incoming.
        $this->actingAs($receiverAgent, 'sanctum')->getJson('/api/external-payments/mine')
            ->assertStatus(200)
            ->assertJsonCount(1, 'data.data')
            ->assertJsonPath('data.data.0.direction', 'incoming');
    }

    public function test_admin_index_exposes_sender_role(): void
    {
        $this->makeAdmin();
        [$senderAgent] = $this->makeAgent('09123456789', 500000);
        [$receiverAgent] = $this->makeAgent('09122222222', 100000);
        $this->makeExternalSystem($apiKey = 'sk_live_testkey123', $receiverAgent);

        $this->initiate($apiKey, ['customer_phone' => '09123456789', 'amount' => 20000])
            ->assertStatus(201);

        $admin = $this->makeUser('09111111112', 1);

        $this->actingAs($admin, 'sanctum')->getJson('/api/external-payments')
            ->assertStatus(200)
            ->assertJsonCount(1, 'data.data')
            ->assertJsonPath('data.data.0.customer.role.name', 'agent')
            ->assertJsonPath('data.data.0.agent.role.name', 'agent');
    }

    public function test_agent_can_update_own_external_system(): void
    {
        [$agent] = $this->makeAgent('09122222222', 100000);
        $system = $this->makeExternalSystem('sk_live_testkey123', $agent);

        $response = $this->actingAs($agent, 'sanctum')->putJson("/api/external-systems/{$system->id}", [
            'name' => 'Updated System Name',
            'system_link' => 'https://updated-link.example.com',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.name', 'Updated System Name');

        $this->assertDatabaseHas('external_systems', [
            'id' => $system->id,
            'name' => 'Updated System Name',
            'system_link' => 'https://updated-link.example.com',
        ]);
    }

    public function test_agent_cannot_update_another_agents_external_system(): void
    {
        [$agent] = $this->makeAgent('09122222222', 100000);
        [$otherAgent] = $this->makeAgent('09133333333', 100000);
        $system = $this->makeExternalSystem('sk_live_testkey123', $agent);

        $response = $this->actingAs($otherAgent, 'sanctum')->putJson("/api/external-systems/{$system->id}", [
            'name' => 'Hacked System Name',
        ]);

        $response->assertStatus(403);

        $this->assertDatabaseHas('external_systems', [
            'id' => $system->id,
            'name' => 'Test Shopping',
        ]);
    }
}

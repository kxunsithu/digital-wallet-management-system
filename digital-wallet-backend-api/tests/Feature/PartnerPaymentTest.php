<?php

namespace Tests\Feature;

use App\Models\CustomerProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class MerchantPaymentTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        DB::table('roles')->insert([
            ['id' => 1, 'name' => 'admin', 'description' => 'Admin', 'created_at' => now(), 'updated_at' => now()],
            ['id' => 4, 'name' => 'customer', 'description' => 'Customer', 'created_at' => now(), 'updated_at' => now()],
            ['id' => 5, 'name' => 'merchant', 'description' => 'Merchant', 'created_at' => now(), 'updated_at' => now()],
        ]);

        DB::table('transfer_settings')->insert([
            'id' => 1,
            'unverified_customer_transfer_limit' => 100000,
            'customer_transfer_fee_percent' => 0.5,
            'merchant_payment_fee_percent' => 1.0,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    protected function makeUser(string $phone, int $roleId, string $status = 'active'): User
    {
        return User::create([
            'phone_number' => $phone,
            'role_id' => $roleId,
            'full_name' => $phone,
            'status' => $status,
            'is_phone_verified' => true,
        ]);
    }

    protected function makeWallet(User $user, float $balance, ?string $walletNumber = null): int
    {
        return DB::table('wallets')->insertGetId([
            'user_id' => $user->id,
            'wallet_number' => $walletNumber ?? 'WAL-'.strtoupper(bin2hex(random_bytes(4))),
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
        CustomerProfile::create([
            'user_id' => $user->id,
            'kyc_status' => $kycStatus,
        ]);
        $this->makeWallet($user, $balance);
        $this->makePin($user);

        return [$user, $user->wallet()->first()];
    }

    protected function createMerchantViaAdmin(string $name = 'Online Shop'): array
    {
        $admin = $this->makeUser('09111111111', 1);
        $adminWallet = $this->makeWallet($admin, 1000000, 'WAL-ADMIN3');

        $response = $this->actingAs($admin, 'sanctum')->postJson('/api/merchants', [
            'merchant_name' => $name,
            'phone_number' => '09200000000',
            'callback_url' => 'https://shop.example.com/callback',
        ]);

        $response->assertStatus(201);

        return [
            'admin' => $admin,
            'admin_wallet_id' => $adminWallet,
            'api_key' => $response->json('data.api_key'),
            'merchant' => $response->json('data.merchant'),
        ];
    }

    public function test_admin_can_create_merchant_and_receives_api_key(): void
    {
        $result = $this->createMerchantViaAdmin();

        $this->assertNotEmpty($result['api_key']);
        $this->assertStringStartsWith('MCH-', $result['api_key']);
        $this->assertDatabaseHas('merchants', [
            'id' => $result['merchant']['id'],
            'merchant_name' => 'Online Shop',
            'status' => 'active',
        ]);
    }

    public function test_merchant_payment_requires_api_key(): void
    {
        $response = $this->postJson('/api/merchants/payment/initiate', [
            'customer_phone' => '09123456789',
            'amount' => 5000,
        ]);

        $response->assertStatus(401);
    }

    public function test_merchant_payment_flow_debits_customer_credits_merchant_and_fee_to_admin(): void
    {
        $result = $this->createMerchantViaAdmin();
        [$customer, $customerWallet] = $this->makeCustomer('09123456789', 'verified', 500000);

        // Merchant wallet balance tracked
        $merchantWalletId = DB::table('wallets')->where('user_id', $result['merchant']['user']['id'])->value('id');

        // Initiate
        $initResponse = $this->withHeaders(['X-API-Key' => $result['api_key']])
            ->postJson('/api/merchants/payment/initiate', [
                'customer_phone' => '09123456789',
                'amount' => 20000,
                'reference' => 'ORDER-001',
            ]);

        $initResponse->assertStatus(200);
        $paymentId = $initResponse->json('data.payment_id');
        $otpCode = $initResponse->json('data.otp_code');
        $this->assertEquals(200.0, (float) $initResponse->json('data.fee'));

        $this->assertDatabaseHas('otp_verifications', [
            'user_id' => $customer->id,
            'purpose' => 'merchant_payment',
            'status' => 'pending',
        ]);

        // Confirm
        $confirmResponse = $this->withHeaders(['X-API-Key' => $result['api_key']])
            ->postJson('/api/merchants/payment/confirm', [
                'payment_id' => $paymentId,
                'otp_code' => $otpCode,
                'pin' => '1234',
            ]);

        $confirmResponse->assertStatus(200);

        $this->assertDatabaseHas('merchant_payments', [
            'id' => $paymentId,
            'status' => 'completed',
        ]);
        $this->assertDatabaseHas('transactions', [
            'transaction_type' => 'merchant_payment',
            'amount' => 20000,
            'fee' => 200,
            'status' => 'completed',
        ]);

        // customer: 500000 - (20000 + 200)
        $this->assertDatabaseHas('wallets', [
            'id' => $customerWallet->id,
            'balance' => 479800,
        ]);
        // merchant: 0 + 20000
        $this->assertDatabaseHas('wallets', [
            'id' => $merchantWalletId,
            'balance' => 20000,
        ]);
        // admin: 1000000 + 200 fee
        $this->assertDatabaseHas('wallets', [
            'id' => $result['admin_wallet_id'],
            'balance' => 1000200,
        ]);

        // OTP is single-use now
        $this->assertDatabaseHas('otp_verifications', [
            'user_id' => $customer->id,
            'purpose' => 'merchant_payment',
            'status' => 'used',
        ]);
    }

    public function test_merchant_payment_rejects_wrong_otp(): void
    {
        $result = $this->createMerchantViaAdmin();
        [$customer, ] = $this->makeCustomer('09123456789', 'verified', 500000);

        $initResponse = $this->withHeaders(['X-API-Key' => $result['api_key']])
            ->postJson('/api/merchants/payment/initiate', [
                'customer_phone' => '09123456789',
                'amount' => 5000,
            ]);

        $paymentId = $initResponse->json('data.payment_id');

        $confirmResponse = $this->withHeaders(['X-API-Key' => $result['api_key']])
            ->postJson('/api/merchants/payment/confirm', [
                'payment_id' => $paymentId,
                'otp_code' => '000000',
                'pin' => '1234',
            ]);

        $confirmResponse->assertStatus(422);
        $this->assertDatabaseHas('merchant_payments', [
            'id' => $paymentId,
            'status' => 'pending',
        ]);
        $this->assertDatabaseCount('transactions', 0);
    }
}

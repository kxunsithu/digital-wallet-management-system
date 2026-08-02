<?php

namespace Tests\Feature;

use App\Models\CustomerProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class CustomerTransferLimitsAndFeesTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        DB::table('roles')->insert([
            ['id' => 1, 'name' => 'admin', 'description' => 'Admin', 'created_at' => now(), 'updated_at' => now()],
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
            'full_name' => $phone,
            'status' => $status,
            'is_phone_verified' => true,
        ]);
    }

    protected function makeWallet(User $user, float $balance): void
    {
        DB::table('wallets')->insert([
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
        CustomerProfile::create([
            'user_id' => $user->id,
            'kyc_status' => $kycStatus,
        ]);
        $this->makeWallet($user, $balance);
        $this->makePin($user);

        return [$user, $user->wallet()->first()];
    }

    public function test_unverified_customer_cannot_transfer_above_limit(): void
    {
        $admin = $this->makeUser('09111111111', 1);
        $this->makeWallet($admin, 1000000);

        [$sender, ] = $this->makeCustomer('09123456789', 'pending', 500000);
        [, $receiver] = $this->makeCustomer('09123456780', 'verified', 100000);

        $response = $this->actingAs($sender, 'sanctum')->postJson('/api/transfers/customer', [
            'receiver_user_id' => $receiver->user_id,
            'amount' => 200000,
            'pin' => '1234',
        ]);

        $response->assertStatus(422);
        $this->assertStringContainsString('NRC-verified', $response->json('message'));
        $this->assertDatabaseCount('transactions', 0);
    }

    public function test_unverified_customer_transfer_within_limit_applies_fee_and_credits_admin(): void
    {
        $admin = $this->makeUser('09111111111', 1);
        $adminWallet = DB::table('wallets')->insertGetId([
            'user_id' => $admin->id,
            'wallet_number' => 'WAL-ADMIN1',
            'balance' => 0,
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        [$sender, ] = $this->makeCustomer('09123456789', 'pending', 500000);
        [$receiverUser, $receiverWallet] = $this->makeCustomer('09123456780', 'verified', 100000);

        $response = $this->actingAs($sender, 'sanctum')->postJson('/api/transfers/customer', [
            'receiver_user_id' => $receiverWallet->user_id,
            'amount' => 10000,
            'pin' => '1234',
        ]);

        $response->assertStatus(200);

        $fee = 50.0; // 0.5% of 10000
        $this->assertDatabaseHas('transactions', [
            'transaction_type' => 'customer_to_customer',
            'amount' => 10000,
            'fee' => 50,
            'status' => 'completed',
        ]);

        // sender: 500000 - (10000 + 50)
        $this->assertDatabaseHas('wallets', [
            'id' => $sender->wallet()->first()->id,
            'balance' => 489950,
        ]);
        // receiver: 100000 + 10000
        $this->assertDatabaseHas('wallets', [
            'id' => $receiverWallet->id,
            'balance' => 110000,
        ]);
        // admin wallet received the fee
        $this->assertDatabaseHas('wallets', [
            'id' => $adminWallet,
            'balance' => 50,
        ]);
    }

    public function test_verified_customer_can_transfer_above_unverified_limit(): void
    {
        $admin = $this->makeUser('09111111111', 1);
        $this->makeWallet($admin, 1000000);

        [$sender, ] = $this->makeCustomer('09123456789', 'verified', 500000);
        [$receiverUser, $receiverWallet] = $this->makeCustomer('09123456780', 'verified', 100000);

        $response = $this->actingAs($sender, 'sanctum')->postJson('/api/transfers/customer', [
            'receiver_user_id' => $receiverWallet->user_id,
            'amount' => 200000,
            'pin' => '1234',
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('transactions', [
            'transaction_type' => 'customer_to_customer',
            'amount' => 200000,
            'fee' => 1000,
            'status' => 'completed',
        ]);
    }

    public function test_agent_receives_customer_transfer_fee_in_admin_wallet(): void
    {
        $admin = $this->makeUser('09111111111', 1);
        $adminWallet = DB::table('wallets')->insertGetId([
            'user_id' => $admin->id,
            'wallet_number' => 'WAL-ADMIN2',
            'balance' => 0,
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // agent role
        DB::table('roles')->insert([
            'id' => 3, 'name' => 'agent', 'description' => 'Agent', 'created_at' => now(), 'updated_at' => now(),
        ]);

        [$sender, ] = $this->makeCustomer('09123456789', 'verified', 500000);

        $agent = $this->makeUser('09122222222', 3);
        $this->makeWallet($agent, 100000);
        $this->makePin($agent);
        $agentWallet = $agent->wallet()->first();

        $response = $this->actingAs($sender, 'sanctum')->postJson('/api/transfers/customer', [
            'receiver_user_id' => $agentWallet->user_id,
            'amount' => 5000,
            'pin' => '1234',
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('transactions', [
            'transaction_type' => 'customer_to_agent',
            'amount' => 5000,
            'fee' => 25,
            'status' => 'completed',
        ]);
        $this->assertDatabaseHas('wallets', [
            'id' => $adminWallet,
            'balance' => 25,
        ]);
    }
}

<?php

namespace Tests\Feature;

use App\Models\AgentProfile;
use App\Models\CustomerLevelConfig;
use App\Models\CustomerProfile;
use App\Models\User;
use App\Services\LevelService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

use function now;

class LevelManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_update_customer_level_config(): void
    {
        DB::table('roles')->insert([
            'id' => 1,
            'name' => 'admin',
            'description' => 'Administrator',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $admin = User::create([
            'phone_number' => '09111111111',
            'role_id' => 1,
            'status' => 'active',
        ]);

        $config = CustomerLevelConfig::create([
            'level' => 'basic',
            'daily_transfer_limit' => 1000,
            'monthly_transfer_limit' => 5000,
            'max_wallet_balance' => 10000,
            'daily_cash_out_limit' => 500,
            'max_transaction_count_daily' => 10,
            'can_use_qr_payment' => false,
            'can_receive_from_agent' => false,
            'requires_kyc' => false,
            'is_active' => true,
        ]);

        $response = $this->actingAs($admin, 'sanctum')
            ->putJson('/api/admin/levels/customers/' . $config->id, [
                'daily_transfer_limit' => 2000,
                'max_wallet_balance' => 20000,
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.daily_transfer_limit', 2000)
            ->assertJsonPath('data.max_wallet_balance', 20000);
    }

    public function test_non_admin_cannot_update_customer_level_config(): void
    {
        DB::table('roles')->insert([
            'id' => 1,
            'name' => 'customer',
            'description' => 'Customer',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $user = User::create([
            'phone_number' => '09999999999',
            'role_id' => 1,
            'status' => 'active',
        ]);

        $config = CustomerLevelConfig::create([
            'level' => 'basic',
            'daily_transfer_limit' => 1000,
            'monthly_transfer_limit' => 5000,
            'max_wallet_balance' => 10000,
            'daily_cash_out_limit' => 500,
            'max_transaction_count_daily' => 10,
            'can_use_qr_payment' => false,
            'can_receive_from_agent' => false,
            'requires_kyc' => false,
            'is_active' => true,
        ]);

        $response = $this->actingAs($user, 'sanctum')
            ->putJson('/api/admin/levels/customers/' . $config->id, [
                'daily_transfer_limit' => 3000,
            ]);

        $response->assertStatus(403);
    }

    public function test_customer_level_is_upgraded_when_transaction_amount_or_nrc_is_sufficient(): void
    {
        DB::table('roles')->insert([
            'id' => 1,
            'name' => 'customer',
            'description' => 'Customer',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $user = User::create([
            'phone_number' => '09777777777',
            'role_id' => 1,
            'status' => 'active',
            'nrc_number' => '12/ABC(N)123456',
        ]);

        CustomerProfile::create([
            'user_id' => $user->id,
            'level' => 'basic',
            'kyc_status' => 'pending',
        ]);

        (new LevelService())->upgradeUserLevel($user, 1000000);

        $this->assertSame('silver', $user->fresh()->customerProfile->level);
    }

    public function test_agent_level_is_upgraded_when_nrc_is_verified(): void
    {
        DB::table('roles')->insert([
            'id' => 2,
            'name' => 'agent',
            'description' => 'Agent',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $user = User::create([
            'phone_number' => '09666666666',
            'role_id' => 2,
            'status' => 'active',
        ]);

        AgentProfile::create([
            'user_id' => $user->id,
            'agent_code' => 'AG0001',
            'level' => 'starter',
            'status' => 'pending',
            'total_volume_monthly' => 0,
        ]);

        DB::table('nrc_verifications')->insert([
            'user_id' => $user->id,
            'status' => 'approved',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        (new LevelService())->upgradeUserLevel($user);

        $this->assertSame('advanced', $user->fresh()->agentProfile->level);
    }

    public function test_customer_can_reach_platinum_level_for_large_verified_transactions(): void
    {
        DB::table('roles')->insert([
            'id' => 1,
            'name' => 'customer',
            'description' => 'Customer',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $user = User::create([
            'phone_number' => '09555555555',
            'role_id' => 1,
            'status' => 'active',
            'nrc_number' => '12/ABC(N)654321',
        ]);

        CustomerProfile::create([
            'user_id' => $user->id,
            'level' => 'basic',
            'kyc_status' => 'pending',
        ]);

        DB::table('nrc_verifications')->insert([
            'user_id' => $user->id,
            'status' => 'approved',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        (new LevelService())->upgradeUserLevel($user, 25000000);

        $this->assertSame('platinum', $user->fresh()->customerProfile->level);
    }

    public function test_customer_transfer_is_rejected_when_daily_limit_is_exceeded(): void
    {
        DB::table('roles')->insert([
            'id' => 1,
            'name' => 'customer',
            'description' => 'Customer',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $sender = User::create([
            'phone_number' => '09444444444',
            'role_id' => 1,
            'status' => 'active',
        ]);

        $receiver = User::create([
            'phone_number' => '09444444445',
            'role_id' => 1,
            'status' => 'active',
        ]);

        CustomerProfile::create([
            'user_id' => $sender->id,
            'level' => 'basic',
            'kyc_status' => 'pending',
        ]);

        CustomerProfile::create([
            'user_id' => $receiver->id,
            'level' => 'basic',
            'kyc_status' => 'pending',
        ]);

        CustomerLevelConfig::create([
            'level' => 'basic',
            'daily_transfer_limit' => 1000,
            'monthly_transfer_limit' => 5000,
            'max_wallet_balance' => 10000,
            'daily_cash_out_limit' => 500,
            'max_transaction_count_daily' => 5,
            'can_use_qr_payment' => false,
            'can_receive_from_agent' => true,
            'requires_kyc' => false,
            'is_active' => true,
        ]);

        DB::table('wallets')->insert([
            ['user_id' => $sender->id, 'wallet_number' => 'WAL-001', 'balance' => 5000, 'currency' => 'MMK', 'status' => 'active', 'created_at' => now(), 'updated_at' => now()],
            ['user_id' => $receiver->id, 'wallet_number' => 'WAL-002', 'balance' => 1000, 'currency' => 'MMK', 'status' => 'active', 'created_at' => now(), 'updated_at' => now()],
        ]);

        DB::table('pins')->insert([
            'user_id' => $sender->id,
            'pin_hash' => bcrypt('1234'),
            'failed_attempts' => 0,
            'is_locked' => false,
            'locked_until' => null,
            'last_changed_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('transactions')->insert([
            'transaction_ref' => 'TX1',
            'sender_wallet_id' => DB::table('wallets')->where('user_id', $sender->id)->value('id'),
            'receiver_wallet_id' => DB::table('wallets')->where('user_id', $receiver->id)->value('id'),
            'transaction_type' => 'customer_to_customer',
            'amount' => 1000,
            'fee' => 0,
            'status' => 'completed',
            'pin_verified' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $response = $this->actingAs($sender, 'sanctum')->postJson('/api/transfers/customer', [
            'receiver_user_id' => $receiver->id,
            'amount' => 1001,
            'pin' => '1234',
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('message', 'Daily transfer limit exceeded for your level.');
    }

    public function test_customer_transfer_is_rejected_when_sender_wallet_is_inactive(): void
    {
        DB::table('roles')->insert([
            'id' => 1,
            'name' => 'customer',
            'description' => 'Customer',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $sender = User::create([
            'phone_number' => '09444444446',
            'role_id' => 1,
            'status' => 'active',
        ]);

        $receiver = User::create([
            'phone_number' => '09444444447',
            'role_id' => 1,
            'status' => 'active',
        ]);

        DB::table('wallets')->insert([
            ['user_id' => $sender->id, 'wallet_number' => 'WAL-003', 'balance' => 5000, 'currency' => 'MMK', 'status' => 'inactive', 'created_at' => now(), 'updated_at' => now()],
            ['user_id' => $receiver->id, 'wallet_number' => 'WAL-004', 'balance' => 1000, 'currency' => 'MMK', 'status' => 'active', 'created_at' => now(), 'updated_at' => now()],
        ]);

        DB::table('pins')->insert([
            'user_id' => $sender->id,
            'pin_hash' => bcrypt('1234'),
            'failed_attempts' => 0,
            'is_locked' => false,
            'locked_until' => null,
            'last_changed_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $response = $this->actingAs($sender, 'sanctum')->postJson('/api/transfers/customer', [
            'receiver_user_id' => $receiver->id,
            'amount' => 100,
            'pin' => '1234',
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('message', 'Sender wallet is inactive.');
    }
}

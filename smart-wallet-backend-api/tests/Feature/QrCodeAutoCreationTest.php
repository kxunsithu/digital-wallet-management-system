<?php

namespace Tests\Feature;

use App\Models\QrCode;
use App\Models\User;
use App\Models\Wallet;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class QrCodeAutoCreationTest extends TestCase
{
    use RefreshDatabase;

    public function test_create_pin_auto_creates_wallet_and_static_qr_code(): void
    {
        $user = User::factory()->create([
            'is_pin_created' => false,
        ]);

        $response = $this->postJson('/api/auth/create-pin', [
            'user_id' => $user->id,
            'pin' => '1234',
            'pin_confirmation' => '1234',
        ]);

        $response->assertStatus(201);

        $this->assertDatabaseHas('wallets', ['user_id' => $user->id]);
        $this->assertDatabaseHas('qr_codes', [
            'user_id' => $user->id,
            'qr_type' => 'static',
            'is_active' => true,
        ]);

        $wallet = Wallet::where('user_id', $user->id)->first();
        $qrCode = QrCode::where('user_id', $user->id)->first();

        $this->assertNotNull($wallet);
        $this->assertNotNull($qrCode);
        $this->assertSame($wallet->id, $qrCode->wallet_id);
        $this->assertNotEmpty($qrCode->qr_code_value);
    }

    public function test_create_pin_does_not_create_duplicate_qr_code(): void
    {
        $user = User::factory()->create([
            'is_pin_created' => false,
        ]);

        $wallet = Wallet::create([
            'user_id' => $user->id,
            'wallet_number' => 'WAL-TEST1234',
            'balance' => 0,
            'currency' => 'MMK',
            'status' => 'active',
        ]);

        QrCode::create([
            'user_id' => $user->id,
            'wallet_id' => $wallet->id,
            'qr_type' => 'static',
            'qr_code_value' => 'SW-EXISTINGCODE',
            'amount' => null,
            'is_active' => true,
            'expires_at' => null,
        ]);

        $this->postJson('/api/auth/create-pin', [
            'user_id' => $user->id,
            'pin' => '1234',
            'pin_confirmation' => '1234',
        ])->assertStatus(201);

        $this->assertSame(1, QrCode::where('user_id', $user->id)->count());
        $this->assertDatabaseHas('qr_codes', [
            'user_id' => $user->id,
            'qr_code_value' => 'SW-EXISTINGCODE',
        ]);
    }

    public function test_verify_pin_ensures_qr_code_exists(): void
    {
        $user = User::factory()->create([
            'is_pin_created' => true,
        ]);

        DB::table('pins')->insert([
            'user_id' => $user->id,
            'pin_hash' => Hash::make('1234'),
            'failed_attempts' => 0,
            'is_locked' => false,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        Wallet::create([
            'user_id' => $user->id,
            'wallet_number' => 'WAL-VERIFY123',
            'balance' => 0,
            'currency' => 'MMK',
            'status' => 'active',
        ]);

        $this->postJson('/api/auth/verify-pin', [
            'user_id' => $user->id,
            'pin' => '1234',
        ])->assertStatus(200);

        $this->assertDatabaseHas('qr_codes', [
            'user_id' => $user->id,
            'qr_type' => 'static',
            'is_active' => true,
        ]);
    }
}

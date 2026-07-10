<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->string('transaction_ref')->unique();
            $table->foreignId('sender_wallet_id')->nullable()->constrained('wallets')->onDelete('set null');
            $table->foreignId('receiver_wallet_id')->nullable()->constrained('wallets')->onDelete('set null');
            $table->enum('transaction_type', [
                'transfer',
                'cash_in',
                'cash_out',
                'qr_payment',
                'bill_payment',
                'top_up',
            ]);
            $table->decimal('amount', 18, 2);
            $table->decimal('fee', 18, 2)->default(0);
            $table->foreignId('qr_id')->nullable()->constrained('qr_codes')->onDelete('set null');
            $table->foreignId('agent_id')->nullable()->constrained('users')->onDelete('set null');
            $table->enum('status', ['pending', 'success', 'failed', 'reversed'])->default('pending');
            $table->boolean('pin_verified')->default(false);
            $table->string('description')->nullable();
            $table->timestamps();

            $table->index(['sender_wallet_id', 'status', 'created_at']);
            $table->index(['receiver_wallet_id', 'status', 'created_at']);
            $table->index(['transaction_type', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};

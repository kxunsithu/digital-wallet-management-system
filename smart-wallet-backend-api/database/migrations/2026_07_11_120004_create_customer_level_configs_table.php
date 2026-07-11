<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customer_level_configs', function (Blueprint $table) {
            $table->id();
            $table->string('level')->unique();
            $table->decimal('daily_transfer_limit', 15, 2)->nullable();
            $table->decimal('monthly_transfer_limit', 15, 2)->nullable();
            $table->decimal('max_wallet_balance', 15, 2)->nullable();
            $table->decimal('daily_cash_out_limit', 15, 2)->nullable();
            $table->unsignedInteger('max_transaction_count_daily')->nullable();
            $table->boolean('can_use_qr_payment')->default(false);
            $table->boolean('can_receive_from_agent')->default(false);
            $table->boolean('requires_kyc')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customer_level_configs');
    }
};

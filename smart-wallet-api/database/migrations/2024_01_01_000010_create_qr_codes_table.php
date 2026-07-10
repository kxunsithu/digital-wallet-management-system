<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('qr_codes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('wallet_id')->constrained('wallets')->onDelete('cascade');
            $table->enum('qr_type', ['static', 'dynamic']);
            $table->string('qr_code_value')->unique();
            $table->decimal('amount', 18, 2)->nullable(); // only for dynamic QR
            $table->boolean('is_active')->default(true);
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'qr_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('qr_codes');
    }
};

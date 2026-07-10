<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('otp_verifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('cascade');
            $table->string('phone_number');
            $table->string('otp_code'); // stored as hashed value
            $table->enum('purpose', ['login', 'register', 'reset_pin', 'transaction']);
            $table->enum('status', ['pending', 'verified', 'expired', 'failed'])->default('pending');
            $table->unsignedInteger('attempt_count')->default(0);
            $table->timestamp('expires_at');
            $table->timestamp('verified_at')->nullable();
            $table->string('delivery_status')->nullable(); // track SMS delivery
            $table->timestamps();

            $table->index(['phone_number', 'purpose', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('otp_verifications');
    }
};

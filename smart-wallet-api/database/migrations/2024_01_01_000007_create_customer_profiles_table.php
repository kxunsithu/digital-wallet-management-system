<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customer_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained('users')->onDelete('cascade');
            $table->enum('level', ['basic', 'silver', 'gold', 'platinum'])->default('basic');
            $table->decimal('custom_limit_override', 18, 2)->nullable();
            $table->enum('kyc_status', ['not_submitted', 'pending', 'approved', 'rejected'])->default('not_submitted');
            $table->string('referral_code')->unique()->nullable();
            $table->foreignId('referred_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();

            $table->index('level');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customer_profiles');
    }
};

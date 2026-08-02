<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transfer_settings', function (Blueprint $table) {
            $table->id();
            $table->decimal('unverified_customer_transfer_limit', 15, 2)->nullable();
            $table->decimal('customer_transfer_fee_percent', 5, 2)->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transfer_settings');
    }
};

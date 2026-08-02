<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('external_payments', function (Blueprint $table) {
            $table->id();
            $table->string('reference')->unique();
            $table->foreignId('external_system_id')->nullable()->constrained('external_systems')->nullOnDelete();
            $table->foreignId('customer_user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('agent_user_id')->constrained('users')->cascadeOnDelete();
            $table->decimal('amount', 15, 2);
            $table->decimal('fee', 15, 2)->default(0);
            $table->string('order_reference')->nullable();
            $table->string('description')->nullable();
            $table->string('status')->default('pending');
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });

        if (Schema::hasTable('transactions') && ! Schema::hasColumn('transactions', 'external_payment_id')) {
            Schema::table('transactions', function (Blueprint $table) {
                $table->foreignId('external_payment_id')->nullable()->after('qr_id')->constrained('external_payments')->nullOnDelete();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('transactions') && Schema::hasColumn('transactions', 'external_payment_id')) {
            Schema::table('transactions', function (Blueprint $table) {
                $table->dropConstrainedForeignId('external_payment_id');
            });
        }

        Schema::dropIfExists('external_payments');
    }
};

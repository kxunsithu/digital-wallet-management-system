<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('agent_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained('users')->onDelete('cascade');
            $table->string('agent_code')->unique();
            $table->enum('level', ['level_1', 'level_2', 'level_3', 'master'])->default('level_1');
            $table->decimal('custom_commission_override', 5, 2)->nullable();
            $table->string('shop_name')->nullable();
            $table->string('shop_address')->nullable();
            $table->string('township')->nullable();
            $table->decimal('float_balance', 18, 2)->default(0);
            $table->foreignId('parent_agent_id')->nullable()->constrained('agent_profiles')->onDelete('set null');
            $table->decimal('total_volume_monthly', 18, 2)->default(0);
            $table->foreignId('approved_by')->nullable()->constrained('users')->onDelete('set null');
            $table->enum('status', ['active', 'inactive', 'suspended'])->default('inactive');
            $table->timestamps();

            $table->index('level');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('agent_profiles');
    }
};

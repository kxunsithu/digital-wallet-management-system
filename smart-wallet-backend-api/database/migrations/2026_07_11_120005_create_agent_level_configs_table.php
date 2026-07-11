<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('agent_level_configs', function (Blueprint $table) {
            $table->id();
            $table->string('level')->unique();
            $table->decimal('daily_cash_limit', 15, 2)->nullable();
            $table->decimal('default_commission_rate', 5, 2)->nullable();
            $table->decimal('min_float_required', 15, 2)->nullable();
            $table->boolean('can_recruit_sub_agent')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('agent_level_configs');
    }
};

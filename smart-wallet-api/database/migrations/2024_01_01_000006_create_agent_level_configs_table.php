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
            $table->enum('level', ['level_1', 'level_2', 'level_3', 'master'])->unique();
            $table->decimal('daily_cash_limit', 18, 2);
            $table->decimal('default_commission_rate', 5, 2);
            $table->decimal('min_float_required', 18, 2);
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

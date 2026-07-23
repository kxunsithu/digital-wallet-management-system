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
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('agent_code')->unique();
            $table->string('shop_name')->nullable();
            $table->string('shop_address')->nullable();
            $table->foreignId('state_region_id')->nullable()->constrained('state_regions')->nullOnDelete();
            $table->foreignId('township_id')->nullable()->constrained('townships')->nullOnDelete();
            $table->foreignId('parent_agent_id')->nullable()->constrained('agent_profiles')->nullOnDelete();
            $table->foreignId('created_by_manager_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('agent_profiles');
    }
};

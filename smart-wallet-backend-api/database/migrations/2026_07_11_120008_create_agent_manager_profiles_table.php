<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('agent_manager_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('manager_code')->unique();
            $table->foreignId('state_region_id')->nullable()->constrained('state_regions')->nullOnDelete();
            $table->foreignId('township_id')->nullable()->constrained('townships')->nullOnDelete();
            $table->decimal('approval_limit', 15, 2)->default(0);
            $table->foreignId('parent_manager_id')->nullable()->constrained('agent_manager_profiles')->nullOnDelete();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('agent_manager_profiles');
    }
};

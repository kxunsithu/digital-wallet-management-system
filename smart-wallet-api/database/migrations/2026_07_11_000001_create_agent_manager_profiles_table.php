<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('agent_manager_profiles')) {
            return;
        }

        Schema::create('agent_manager_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained('users')->onDelete('cascade');
            $table->string('manager_code')->unique();
            $table->string('region')->nullable();
            $table->string('township')->nullable();
            $table->enum('status', ['active', 'inactive', 'suspended'])->default('inactive');
            $table->decimal('approval_limit', 18, 2)->default(0);
            $table->foreignId('parent_manager_id')->nullable()->constrained('agent_manager_profiles')->onDelete('set null');
            $table->foreignId('approved_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();

            $table->index(['status', 'region']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('agent_manager_profiles');
    }
};

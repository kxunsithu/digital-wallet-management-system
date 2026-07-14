<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('agent_profiles', function (Blueprint $table) {
            $table->dropColumn('status');
        });

        Schema::table('agent_manager_profiles', function (Blueprint $table) {
            $table->dropColumn('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('agent_profiles', function (Blueprint $table) {
            $table->string('status')->default('pending');
        });

        Schema::table('agent_manager_profiles', function (Blueprint $table) {
            $table->string('status')->default('pending');
        });
    }
};

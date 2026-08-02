<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Drop the database-backed location fields now that location is derived
     * from the user's NRC number.
     */
    public function up(): void
    {
        foreach (['agent_profiles', 'agent_manager_profiles', 'customer_profiles'] as $table) {
            if (! Schema::hasTable($table)) {
                continue;
            }
            foreach (['township_id', 'state_region_id'] as $column) {
                if (! Schema::hasColumn($table, $column)) {
                    continue;
                }
                Schema::table($table, function (Blueprint $table) use ($column) {
                    $table->dropForeign([$column]);
                    $table->dropColumn($column);
                });
            }
        }

        Schema::dropIfExists('townships');
        Schema::dropIfExists('state_regions');
    }

    public function down(): void
    {
        Schema::create('state_regions', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->timestamps();
        });

        Schema::create('townships', function (Blueprint $table) {
            $table->id();
            $table->foreignId('state_region_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->timestamps();
        });

        foreach (['agent_profiles', 'agent_manager_profiles', 'customer_profiles'] as $table) {
            Schema::table($table, function (Blueprint $table) {
                $table->foreignId('state_region_id')->nullable()->constrained('state_regions')->nullOnDelete();
                $table->foreignId('township_id')->nullable()->constrained('townships')->nullOnDelete();
            });
        }
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('external_systems', function (Blueprint $table) {
            $table->string('system_logo')->nullable()->after('system_link');
        });
    }

    public function down(): void
    {
        Schema::table('external_systems', function (Blueprint $table) {
            $table->dropColumn('system_logo');
        });
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('external_systems', function (Blueprint $table) {
            $table->string('api_key_hash')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('external_systems', function (Blueprint $table) {
            $table->string('api_key_hash')->nullable(false)->change();
        });
    }
};

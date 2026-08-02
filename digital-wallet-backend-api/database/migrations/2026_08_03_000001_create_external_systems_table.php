<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('external_systems', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('api_key_hash');
            $table->string('api_key_prefix', 12)->nullable();
            $table->string('status')->default('active');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('external_systems');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pins', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained('users')->onDelete('cascade');
            $table->string('pin_hash');
            $table->unsignedInteger('failed_attempts')->default(0);
            $table->boolean('is_locked')->default(false);
            $table->timestamp('locked_until')->nullable();
            $table->timestamp('last_changed_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pins');
    }
};

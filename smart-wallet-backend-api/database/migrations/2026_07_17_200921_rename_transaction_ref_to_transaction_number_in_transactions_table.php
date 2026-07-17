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
        if (Schema::hasColumn('transactions', 'transaction_ref')) {
            Schema::table('transactions', function (Blueprint $table) {
                $table->renameColumn('transaction_ref', 'transaction_number');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('transactions', 'transaction_number')) {
            Schema::table('transactions', function (Blueprint $table) {
                $table->renameColumn('transaction_number', 'transaction_ref');
            });
        }
    }
};

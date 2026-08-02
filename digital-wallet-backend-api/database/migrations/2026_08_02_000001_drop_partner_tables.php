<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        foreach (['partner_payments', 'partners', 'merchant_payments', 'merchants', 'partner_withdrawals'] as $table) {
            Schema::dropIfExists($table);
        }

        if (Schema::hasTable('transfer_settings')) {
            Schema::table('transfer_settings', function (Blueprint $table) {
                foreach (['partner_payment_fee_percent', 'merchant_payment_fee_percent'] as $column) {
                    if (Schema::hasColumn('transfer_settings', $column)) {
                        $table->dropColumn($column);
                    }
                }
            });
        }

        DB::table('transactions')
            ->whereIn('transaction_type', ['merchant_payment', 'partner_payment'])
            ->delete();

        DB::table('otp_verifications')
            ->whereIn('purpose', ['merchant_payment', 'partner_payment'])
            ->delete();
    }

    public function down(): void
    {
        if (! Schema::hasTable('transfer_settings')) {
            return;
        }

        if (! Schema::hasColumn('transfer_settings', 'partner_payment_fee_percent')) {
            Schema::table('transfer_settings', function (Blueprint $table) {
                $table->decimal('partner_payment_fee_percent', 5, 2)->default(0);
            });
        }
    }
};

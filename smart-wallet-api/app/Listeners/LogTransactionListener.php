<?php

namespace App\Listeners;

use App\Events\TransactionCompletedEvent;
use App\Models\AuditLog;

class LogTransactionListener
{
    /**
     * Handle the transaction completed event.
     */
    public function handle(TransactionCompletedEvent $event): void
    {
        $transaction = $event->transaction;

        AuditLog::create([
            'user_id' => $transaction->senderWallet?->user_id ?? $transaction->agent_id,
            'action' => 'transaction_completed',
            'target_table' => 'transactions',
            'target_id' => $transaction->id,
            'details' => json_encode([
                'type' => $transaction->transaction_type,
                'amount' => $transaction->amount,
                'ref' => $transaction->transaction_ref,
                'status' => $transaction->status,
            ]),
        ]);
    }
}

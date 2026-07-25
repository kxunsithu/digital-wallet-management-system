<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\TransactionResource;
use App\Models\Transaction;
use Illuminate\Http\Request;

class TransactionController extends Controller
{
    /**
     * Display a listing of transactions.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $perPage = (int) $request->query('per_page', 15);

        $query = Transaction::with(['senderWallet.user', 'receiverWallet.user', 'agent']);

        // search by transaction_number or sender/receiver phone
        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('transaction_number', 'like', "%{$search}%")
                    ->orWhereHas('senderWallet.user', function ($qq) use ($search) {
                        $qq->where('phone_number', 'like', "%{$search}%");
                    })
                    ->orWhereHas('receiverWallet.user', function ($qq) use ($search) {
                        $qq->where('phone_number', 'like', "%{$search}%");
                    });
            });
        }

        // filter by transaction_type
        if ($type = $request->query('transaction_type')) {
            $query->where('transaction_type', $type);
        }

        // filter by status
        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        // filter by user_id (matches sender or receiver wallet owner)
        if ($userId = $request->query('user_id')) {
            $query->where(function ($q) use ($userId) {
                $q->whereHas('senderWallet', function ($qq) use ($userId) {
                    $qq->where('user_id', $userId);
                })->orWhereHas('receiverWallet', function ($qq) use ($userId) {
                    $qq->where('user_id', $userId);
                });
            });
        } else {
            // if not admin and no user filter, restrict to own transactions
            $roleName = optional($user->role)->name;
            if ($roleName !== 'admin') {
                $query->where(function ($q) use ($user) {
                    $q->whereHas('senderWallet', function ($qq) use ($user) {
                        $qq->where('user_id', $user->id);
                    })->orWhereHas('receiverWallet', function ($qq) use ($user) {
                        $qq->where('user_id', $user->id);
                    });
                });
            }
        }

        $transactions = $query->orderBy('created_at', 'desc')->paginate($perPage);

        return TransactionResource::collection($transactions);
    }

    /**
     * Display the specified transaction.
     */
    public function show(Request $request, $id)
    {
        $user = $request->user();

        $tx = Transaction::with(['senderWallet.user', 'receiverWallet.user', 'agent'])->findOrFail($id);

        $roleName = optional($user->role)->name;
        if ($roleName !== 'admin') {
            // ensure user is part of this transaction
            $isRelated = (optional($tx->senderWallet)->user_id === $user->id) || (optional($tx->receiverWallet)->user_id === $user->id) || ($tx->agent_id === $user->id);
            if (! $isRelated) {
                return response()->json(['message' => 'Forbidden'], 403);
            }
        }

        return new TransactionResource($tx);
    }
}

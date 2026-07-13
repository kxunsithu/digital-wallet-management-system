<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Wallet;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class WalletController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $perPage = (int) $request->query('per_page', 15);
        $query = Wallet::with('user');

        $includeAdmin = filter_var($request->query('include_admin', false), FILTER_VALIDATE_BOOLEAN);
        $adminId = $request->query('admin_id');

        if (! $includeAdmin) {
            $adminRoleId = DB::table('roles')->where('name', 'admin')->value('id');
            if (! is_null($adminRoleId)) {
                $query->whereHas('user', function ($userQuery) use ($adminRoleId) {
                    $userQuery->where('role_id', '!=', $adminRoleId);
                });
            }
        }

        if ($adminId !== null) {
            $query->where('user_id', (int) $adminId);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        $list = $query->orderByDesc('id')->paginate($perPage);

        return response()->json(['success' => true, 'data' => $list], 200);
    }

    public function show($id): JsonResponse
    {
        $wallet = Wallet::with('user')->find($id);
        if (! $wallet) {
            return response()->json(['success' => false, 'message' => 'Not found.'], 404);
        }

        return response()->json(['success' => true, 'data' => $wallet], 200);
    }

    public function toggleStatus($id): JsonResponse
    {
        $wallet = Wallet::find($id);
        if (! $wallet) {
            return response()->json(['success' => false, 'message' => 'Not found.'], 404);
        }

        $currentStatus = $wallet->status ?? 'inactive';
        $newStatus = $currentStatus === 'active' ? 'inactive' : 'active';
        $wallet->update(['status' => $newStatus]);

        return response()->json([
            'success' => true,
            'message' => 'Wallet status updated.',
            'status' => $newStatus,
            'data' => $wallet->fresh()->load('user'),
        ], 200);
    }
}

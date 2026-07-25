<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class EnsureAdmin
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): mixed
    {
        $user = $request->user();
        if (! $user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        $roleId = $user->role_id ?? null;
        if (empty($roleId)) {
            return response()->json(['success' => false, 'message' => 'Forbidden. Admin only.'], 403);
        }

        $roleName = DB::table('roles')->where('id', $roleId)->value('name');
        if (! $roleName || strtolower($roleName) !== 'admin') {
            return response()->json(['success' => false, 'message' => 'Forbidden. Admin only.'], 403);
        }

        return $next($request);
    }
}

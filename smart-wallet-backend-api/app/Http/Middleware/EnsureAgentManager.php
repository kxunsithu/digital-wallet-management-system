<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class EnsureAgentManager
{
    public function handle(Request $request, Closure $next): mixed
    {
        $user = $request->user();
        if (! $user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        $exists = DB::table('agent_manager_profiles')->where('user_id', $user->id)->exists();
        if (! $exists) {
            return response()->json(['success' => false, 'message' => 'Forbidden. Agent manager only.'], 403);
        }

        return $next($request);
    }
}

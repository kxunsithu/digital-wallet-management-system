<?php

namespace App\Http\Middleware;

use App\Http\Responses\ApiResponse;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    /**
     * Handle an incoming request.
     * Usage: middleware('role:admin') or middleware('role:admin,agent')
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (!$user) {
            return ApiResponse::unauthorized('Unauthenticated.');
        }

        // Load role relationship if not already loaded
        if (!$user->relationLoaded('role')) {
            $user->load('role');
        }

        if (!in_array($user->role->name, $roles)) {
            return ApiResponse::forbidden('You do not have the required role to access this resource.');
        }

        return $next($request);
    }
}
